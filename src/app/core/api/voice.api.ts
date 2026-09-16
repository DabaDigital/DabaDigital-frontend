import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { APP_FIELD_TO_WIRE, type VoiceExtractResponseDto, type VoiceRealtimeSessionDto } from '../models/voice-operation.model';
import type { ProjectFormState } from '../models/project-form.model';

/**
 * Components never call `HttpClient` directly (CLAUDE.md § Architecture
 * rules) — this owns both requests and the mapping to/from the app's
 * camelCase models.
 *
 * `X-Voice-Consent: granted` is sent on every call here, never elsewhere —
 * the privacy notice must be acknowledged first (frontend CLAUDE.md
 * invariant 6), and `RealtimeVoiceService` is the only caller, gated behind
 * that acknowledgement.
 */
@Injectable({ providedIn: 'root' })
export class VoiceApi {
  private readonly http = inject(HttpClient);

  private readonly consentHeaders = new HttpHeaders({ 'X-Voice-Consent': 'granted' });

  /** Mints an ephemeral OpenAI client secret. The browser uses it to open a WebRTC session
   * directly against `gpt-live-transcribe` — this call is the entire round-trip to our backend
   * for the transcription half; no audio ever passes through it. */
  realtimeSession(locale: string): Promise<VoiceRealtimeSessionDto> {
    return firstValueFrom(
      this.http.post<VoiceRealtimeSessionDto>(
        `${environment.apiBaseUrl}/voice/realtime_session`,
        { locale },
        { headers: this.consentHeaders },
      ),
    );
  }

  /** Transcript text (never audio) + current field state -> statused operations + merged view.
   * `voiceSessionId` is optional and purely a support/debugging correlation id — see backend
   * README § API reference. */
  extract(
    transcript: string,
    currentFields: ProjectFormState,
    locale: string,
    voiceSessionId: string | null,
  ): Promise<VoiceExtractResponseDto> {
    return firstValueFrom(
      this.http.post<VoiceExtractResponseDto>(
        `${environment.apiBaseUrl}/voice/extract`,
        {
          transcript,
          locale,
          voice_session_id: voiceSessionId,
          current_fields: this.toWireFields(currentFields),
        },
        { headers: this.consentHeaders },
      ),
    );
  }

  private toWireFields(fields: ProjectFormState): Record<string, { value: unknown; source: string }> {
    const wire: Record<string, { value: unknown; source: string }> = {};
    for (const [appField, wireField] of Object.entries(APP_FIELD_TO_WIRE)) {
      const state = fields[appField as keyof ProjectFormState];
      wire[wireField] = { value: state.value, source: state.source };
    }
    return wire;
  }
}
