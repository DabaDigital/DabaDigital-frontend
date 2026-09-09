/**
 * Types for the browser↔OpenAI WebRTC transcription session
 * (`core/voice/realtime-voice.service.ts`). Not a wire contract with our own
 * backend — this is OpenAI's Realtime API event shape, confirmed against
 * https://developers.openai.com/api/docs/guides/realtime-webrtc and
 * .../realtime-transcription (2026-09-09). Re-verify against the current
 * guide if events stop arriving; this is a third party's API surface.
 */

/** One signal drives every visual — button label, indicator, disabled state, aria attributes
 * (frontend CLAUDE.md § Architecture rules: "never track 'is recording' in a second boolean"). */
export type RecorderState =
  | 'idle'
  | 'requesting-permission'
  | 'connecting'
  | 'recording'
  | 'processing'
  | 'error'
  | 'unsupported';

export type RecorderErrorReason =
  | 'permission-denied'
  | 'unsupported-browser'
  | 'insecure-context'
  | 'session-unavailable'
  | 'connection-failed';

/** Incremental text as the model recognizes it. */
export interface TranscriptionDeltaEvent {
  readonly type: 'conversation.item.input_audio_transcription.delta';
  readonly item_id: string;
  readonly delta: string;
}

/** One spoken segment finalized. */
export interface TranscriptionCompletedEvent {
  readonly type: 'conversation.item.input_audio_transcription.completed';
  readonly item_id: string;
  readonly transcript: string;
}

export interface RealtimeErrorEvent {
  readonly type: 'error';
  readonly error?: { readonly message?: string; readonly code?: string };
}

export type RealtimeServerEvent =
  | TranscriptionDeltaEvent
  | TranscriptionCompletedEvent
  | RealtimeErrorEvent
  | { readonly type: string }; // the API emits many event types this app doesn't act on — ignored by default
