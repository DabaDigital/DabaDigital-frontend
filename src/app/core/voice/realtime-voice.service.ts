import { Injectable, inject, signal } from '@angular/core';
import { Subject, Subscription, concatMap, debounceTime, from } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { VoiceLanguage } from '../../../environments/environment.model';
import { VoiceApi } from '../api/voice.api';
import type { ProjectFormState } from '../models/project-form.model';
import type { VoiceExtractResponseDto } from '../models/voice-operation.model';
import type {
  RealtimeErrorEvent,
  RealtimeServerEvent,
  RecorderErrorReason,
  RecorderState,
  TranscriptionCompletedEvent,
  TranscriptionDeltaEvent,
} from '../models/voice-session.model';

/** Where the browser posts the WebRTC SDP offer for a Realtime session — see
 * https://developers.openai.com/api/docs/guides/realtime-webrtc (confirmed 2026-09-09). */
const REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls';

/**
 * Owns the entire browser↔OpenAI voice pipeline: mic permission, the WebRTC
 * session, transcript accumulation, and the debounced `/voice/extract` turn
 * loop. Impure by nature (HTTP, WebRTC, signals) — the actual merge rules it
 * delegates to are pure and live in `field-merge.ts`; this service never
 * decides what a field's next value is, it only reports what OpenAI and our
 * backend said via `lastResult`, for the caller to fold in.
 *
 * One signal (`recorderState`) drives every visual — see CLAUDE.md
 * § Architecture rules. `lastResult` is a plain signal, not swallowed
 * internally, so the consuming component can run `mergeVoiceOperations`
 * itself and keep its `ProjectFormState` and reactive form in sync in one
 * place, per CLAUDE.md § Conventions.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeVoiceService {
  private readonly voiceApi = inject(VoiceApi);

  private readonly _recorderState = signal<RecorderState>('idle');
  readonly recorderState = this._recorderState.asReadonly();

  /** Display-only cumulative transcript — never persisted, never sent with the final submission
   * (invariant 7). This is also what gets sent to `/voice/extract`, debounced. */
  private readonly _transcript = signal('');
  readonly transcript = this._transcript.asReadonly();

  private readonly _errorReason = signal<RecorderErrorReason | null>(null);
  readonly errorReason = this._errorReason.asReadonly();

  /** The most recent completed turn's response. An `effect()` in the consuming component reacts
   * to this and applies `mergeVoiceOperations` — this service does not touch form state itself. */
  private readonly _lastResult = signal<VoiceExtractResponseDto | null>(null);
  readonly lastResult = this._lastResult.asReadonly();

  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private micStream: MediaStream | null = null;
  private sessionId = '';
  private locale: VoiceLanguage = 'auto';
  private getCurrentFields: (() => ProjectFormState) | null = null;

  // Per-segment transcript tracking — see the module's design note in CLAUDE.md: a `delta` event
  // carries an incremental chunk for one `item_id`, a `completed` event carries that same item's
  // *authoritative full text*. Naively appending both double-counts every segment; instead, the
  // in-progress item's text is held separately and only folded into `finalizedSegments` (replaced
  // by the server's own full-text version, not the locally-accumulated one) once it completes.
  private currentItemId: string | null = null;
  private currentItemText = '';
  private finalizedSegments: string[] = [];

  private readonly turnSubject = new Subject<string>();
  private turnSubscription: Subscription | null = null;

  /** `getUserMedia` requires a secure context; WebRTC needs `RTCPeerConnection`. Both are broadly
   * supported (Chrome, Edge, Firefox, Safari 16+) — this should rarely trip in practice, unlike
   * the narrower Web Speech API this replaced.
   *
   * Reads the bare `isSecureContext` global, not `window.isSecureContext` — the same value in a
   * real browser (`Window` exposes it at global scope), but the two are not interchangeable in
   * every test/worker environment, and the bare form is what test doubles stub. */
  static isSupported(): boolean {
    return (
      typeof isSecureContext !== 'undefined' &&
      isSecureContext &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof RTCPeerConnection !== 'undefined'
    );
  }

  /**
   * @param getCurrentFields Read the *current* form state at the moment each turn fires — never
   *   a snapshot taken at `start()`, or every turn after the first would ignore manual edits made
   *   meanwhile and the backend's manual-lock check would work off stale data.
   */
  async start(getCurrentFields: () => ProjectFormState, locale: VoiceLanguage): Promise<void> {
    const state = this._recorderState();
    if (state === 'recording' || state === 'connecting' || state === 'requesting-permission') {
      return;
    }

    if (!RealtimeVoiceService.isSupported()) {
      this._recorderState.set('unsupported');
      this._errorReason.set(
        typeof isSecureContext !== 'undefined' && !isSecureContext
          ? 'insecure-context'
          : 'unsupported-browser',
      );
      return;
    }

    this.getCurrentFields = getCurrentFields;
    this.locale = locale;
    this.sessionId = crypto.randomUUID();
    this.currentItemId = null;
    this.currentItemText = '';
    this.finalizedSegments = [];
    this._transcript.set('');
    this._errorReason.set(null);
    this._recorderState.set('requesting-permission');

    let micStream: MediaStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this._recorderState.set('error');
      this._errorReason.set('permission-denied');
      return;
    }
    this.micStream = micStream;
    this._recorderState.set('connecting');

    let clientSecret: string;
    try {
      clientSecret = (await this.voiceApi.realtimeSession(locale)).client_secret;
    } catch {
      this.releaseMic();
      this._recorderState.set('error');
      this._errorReason.set('session-unavailable');
      return;
    }

    try {
      await this.connectWebRtc(clientSecret, micStream);
    } catch {
      this.releaseMic();
      this._recorderState.set('error');
      this._errorReason.set('connection-failed');
      return;
    }

    // Sequential turns: `concatMap` awaits each inner call before subscribing to the next, so
    // operations can never arrive out of order (CLAUDE.md § Architecture rules). `runTurn` catches
    // its own errors — a failed turn must not kill this pipeline for the rest of the recording.
    this.turnSubscription = this.turnSubject
      .pipe(
        debounceTime(environment.voice.chunkMs),
        concatMap((transcript) => from(this.runTurn(transcript))),
      )
      .subscribe();

    this._recorderState.set('recording');
  }

  /** Stop → release the mic immediately, then send whatever transcript hasn't been sent yet as a
   * final turn (frontend README § Flow: "■ Stop → final chunk with is_final"-equivalent). */
  stop(): void {
    this.turnSubscription?.unsubscribe();
    this.turnSubscription = null;
    this.dataChannel?.close();
    this.peerConnection?.close();
    this.dataChannel = null;
    this.peerConnection = null;
    this.releaseMic();

    if (this._recorderState() === 'unsupported' || this._recorderState() === 'error') {
      return; // nothing was ever recording — leave the state as the user last saw it.
    }

    const finalTranscript = this.cumulativeTranscript();
    if (!finalTranscript) {
      this._recorderState.set('idle');
      return;
    }

    this._recorderState.set('processing');
    void this.runTurn(finalTranscript).finally(() => {
      if (this._recorderState() === 'processing') {
        this._recorderState.set('idle');
      }
    });
  }

  private releaseMic(): void {
    this.micStream?.getTracks().forEach((track) => track.stop());
    this.micStream = null;
  }

  private async connectWebRtc(clientSecret: string, micStream: MediaStream): Promise<void> {
    const pc = new RTCPeerConnection();
    this.peerConnection = pc;

    for (const track of micStream.getTracks()) {
      pc.addTrack(track, micStream);
    }

    const dc = pc.createDataChannel('oai-events');
    this.dataChannel = dc;
    dc.addEventListener('message', (event: MessageEvent<string>) => this.handleServerEvent(event));

    pc.addEventListener('connectionstatechange', () => {
      const failed = pc.connectionState === 'failed' || pc.connectionState === 'closed';
      if (failed && this._recorderState() === 'recording') {
        this.releaseMic();
        this._recorderState.set('error');
        this._errorReason.set('connection-failed');
      }
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpResponse = await fetch(REALTIME_CALLS_URL, {
      method: 'POST',
      body: offer.sdp,
      headers: { Authorization: `Bearer ${clientSecret}`, 'Content-Type': 'application/sdp' },
    });
    if (!sdpResponse.ok) {
      throw new Error(`realtime/calls responded ${sdpResponse.status}`);
    }
    const answerSdp = await sdpResponse.text();
    await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
  }

  private handleServerEvent(event: MessageEvent<string>): void {
    let payload: RealtimeServerEvent;
    try {
      payload = JSON.parse(event.data) as RealtimeServerEvent;
    } catch {
      return;
    }

    switch (payload.type) {
      case 'conversation.item.input_audio_transcription.delta': {
        const delta = payload as TranscriptionDeltaEvent;
        if (delta.item_id !== this.currentItemId) {
          this.currentItemId = delta.item_id;
          this.currentItemText = '';
        }
        this.currentItemText += delta.delta;
        this.publishTranscript(true);
        return;
      }
      case 'conversation.item.input_audio_transcription.completed': {
        const completed = payload as TranscriptionCompletedEvent;
        this.finalizedSegments.push(completed.transcript);
        if (completed.item_id === this.currentItemId) {
          this.currentItemId = null;
          this.currentItemText = '';
        }
        this.publishTranscript(true);
        return;
      }
      case 'error': {
        // A single provider-side error event isn't necessarily fatal to the whole session — the
        // connection-state handler above is what actually decides the session died. Voice
        // degrades, it never blocks (CLAUDE.md § Architecture rules); logging is enough here.
        console.warn('[RealtimeVoiceService] provider error event', (payload as RealtimeErrorEvent).error);
        return;
      }
      default:
        return; // the API emits many event types this app doesn't act on.
    }
  }

  private publishTranscript(queueTurn: boolean): void {
    const transcript = this.cumulativeTranscript();
    this._transcript.set(transcript);
    if (queueTurn && transcript) {
      this.turnSubject.next(transcript);
    }
  }

  private cumulativeTranscript(): string {
    const parts = [...this.finalizedSegments];
    if (this.currentItemText.trim()) {
      parts.push(this.currentItemText);
    }
    return parts.join(' ').trim();
  }

  private async runTurn(transcript: string): Promise<void> {
    if (!transcript.trim() || !this.getCurrentFields) {
      return;
    }
    try {
      const result = await this.voiceApi.extract(transcript, this.getCurrentFields(), this.locale, this.sessionId);
      this._lastResult.set(result);
    } catch {
      // Dropped, not fatal — a lost turn is recoverable, a broken session is not (CLAUDE.md).
    }
  }
}
