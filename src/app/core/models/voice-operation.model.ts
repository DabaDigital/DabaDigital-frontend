/**
 * Wire types for `POST /voice/extract` and `POST /voice/realtime_session`.
 * These mirror the backend's response shape exactly — snake_case as it comes
 * off the wire. Mapping to the camelCase app models happens in
 * `core/api/voice.api.ts`, never in a component (CLAUDE.md § Architecture rules).
 *
 * Any change to this shape is a cross-repo change: see
 * `../DabaDigital-backend` README § API reference.
 */

import type { VoiceFillableField } from './project-form.model';

/** The wire form of `VoiceFillableField` — snake_case, matching `ProjectRequest`'s Mongoid fields. */
export type VoiceOperationFieldWire =
  'full_name' | 'email' | 'company_name' | 'project_type' | 'budget' | 'description';

export const WIRE_FIELD_TO_APP: Readonly<Record<VoiceOperationFieldWire, VoiceFillableField>> = {
  full_name: 'fullName',
  email: 'email',
  company_name: 'companyName',
  project_type: 'projectType',
  budget: 'budget',
  description: 'description',
};

export const APP_FIELD_TO_WIRE: Readonly<Record<VoiceFillableField, VoiceOperationFieldWire>> = {
  fullName: 'full_name',
  email: 'email',
  companyName: 'company_name',
  projectType: 'project_type',
  budget: 'budget',
  description: 'description',
};

/** Only `replace` and `clear` exist for this form's fields — see backend CLAUDE.md's
 * OpenAI SDK section: there is no array-valued field left to `add`/`remove` on. */
export type VoiceOperationKind = 'replace' | 'clear';

/** `applied` — the server merged it. `suggested` — below the confidence floor, or targeting a
 * field the visitor has manually edited. A suggestion is never written into the form directly. */
export type VoiceOperationStatus = 'applied' | 'suggested';

export interface VoiceOperationDto {
  readonly field: VoiceOperationFieldWire;
  readonly op: VoiceOperationKind;
  /** `string` for every field except `budget`, which carries `{ range, raw }`. `null` for `clear`. */
  readonly value: string | { range: string | null; raw: string | null } | null;
  readonly confidence: number;
  readonly status: VoiceOperationStatus;
  readonly evidence: string;
}

/** One field's wire-shaped state, as sent in `current_fields` and received back in `fields`. */
export interface WireFieldState {
  readonly value: unknown;
  readonly source: 'empty' | 'voice' | 'manual';
}

export interface VoiceExtractResponseDto {
  readonly operations: readonly VoiceOperationDto[];
  readonly fields: Readonly<Record<VoiceOperationFieldWire, WireFieldState>>;
}

export interface VoiceRealtimeSessionDto {
  readonly client_secret: string;
  readonly expires_at: number;
  readonly model: string;
}
