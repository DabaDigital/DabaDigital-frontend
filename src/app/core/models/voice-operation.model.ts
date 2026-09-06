/**
 * Wire types for `POST /voice/turns`. These mirror the backend's response
 * serializer exactly — snake_case as it comes off the wire. Mapping to the
 * camelCase app models happens in `core/api/voice.api.ts`, never in a component.
 *
 * Any change to this shape or to the operation vocabulary is a cross-repo
 * change: see `../DabaDigital-backend` README § API reference.
 */

export type VoiceOperationField =
  'project_type' | 'services' | 'budget' | 'deadline' | 'technologies' | 'description';

export type VoiceOperationKind = 'add' | 'replace' | 'remove' | 'clear';

/**
 * `applied` — the server merged it. `suggested` — below the confidence floor, or
 * targeting a locked field. A suggestion is never written into the form.
 */
export type VoiceOperationStatus = 'applied' | 'suggested';

export interface VoiceOperationDto {
  field: VoiceOperationField;
  op: VoiceOperationKind;
  /** Omitted for `clear`. */
  value?: unknown;
  confidence: number;
  status: VoiceOperationStatus;
  evidence: string;
}

export interface VoiceTranscriptDto {
  text: string;
  cumulative: string;
  language: string;
  confidence: number;
}

export interface VoiceTurnResponseDto {
  session_id: string;
  chunk_index: number;
  transcript: VoiceTranscriptDto;
  operations: VoiceOperationDto[];
  /** The merged view after applying the operations. */
  fields: Record<string, unknown>;
  warnings: string[];
}
