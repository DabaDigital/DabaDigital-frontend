/**
 * `(state, operations, now) => nextState`. Pure — no HTTP, no signals, no
 * `Date.now()`, no DOM (frontend CLAUDE.md § Architecture rules). Anything
 * impure belongs in `realtime-voice.service.ts`.
 *
 * The backend (`Voice::MergeService`) is authoritative and already decides
 * `applied` vs `suggested` per operation — including the manual-lock and
 * confidence-floor checks — before this ever runs. This module's job is
 * narrower but still essential: **the field state a response was computed
 * against can be stale by the time the response arrives.** A visitor can
 * type into a field in the few hundred milliseconds between "turn sent" and
 * "turn answered"; blindly applying the server's `applied` operations would
 * silently overwrite what they just typed, which is exactly the bug
 * invariant 2 ("manual input wins, permanently") exists to prevent. So every
 * rule below is re-checked against the *current* client state, not trusted
 * from the wire.
 *
 * Every field is written through an explicit, literal property name — never
 * a computed `[field]: ...` — so a mistyped or widened value is a compile
 * error, not a runtime one: `ProjectFormState`'s six fields have genuinely
 * different value types (`Budget` vs `ProjectType` vs `string`), and a
 * computed key can't carry that narrowing through a spread.
 *
 * Mirrors `Voice::MergeService` in `../DabaDigital-backend` — every rule
 * here has a matching rule there, and the two must never disagree (frontend
 * CLAUDE.md § Cross-repo).
 */

import type {
  Budget,
  BudgetRange,
  ProjectFormState,
  ProjectType,
  VoiceFillableField,
} from '../models/project-form.model';
import { WIRE_FIELD_TO_APP, type VoiceOperationDto } from '../models/voice-operation.model';

export interface FieldSuggestion {
  readonly field: VoiceFillableField;
  readonly value: string | Budget | null;
  readonly evidence: string;
  readonly confidence: number;
}

export interface MergeResult {
  readonly fields: ProjectFormState;
  /** Operations that could be shown as a dismissible suggestion chip — either the server marked
   * them `suggested`, or this field has since gone `manual` client-side (rule 1, re-checked live). */
  readonly suggestions: readonly FieldSuggestion[];
}

const PROJECT_TYPES: ReadonlySet<string> = new Set([
  'website',
  'ecommerce',
  'web_app',
  'mobile_app',
  'redesign',
  'api',
  'other',
]);
const BUDGET_RANGES: ReadonlySet<string> = new Set(['s', 'm', 'l', 'xl']);

/**
 * Applies every operation the server marked `applied`, unless the target field is `manual`
 * *right now* — in which case it becomes a suggestion instead, never a silent overwrite.
 *
 * @param now Caller-supplied timestamp (`Date.now()`), so this stays deterministic and testable —
 *   see the module doc for why the function itself never calls `Date.now()`.
 */
export function mergeVoiceOperations(
  current: ProjectFormState,
  operations: readonly VoiceOperationDto[],
  now: number,
): MergeResult {
  let fields = current;
  const suggestions: FieldSuggestion[] = [];

  for (const operation of operations) {
    const field = WIRE_FIELD_TO_APP[operation.field];
    // Rule: manual wins, permanently. Re-checked here even though the server already applied
    // this check against a possibly-stale snapshot — see the module doc.
    const isLocked = current[field].source === 'manual';

    if (operation.status === 'applied' && !isLocked) {
      // Rule: corrections replace, they don't append — the incoming value replaces the field's
      // value outright, never merged with what was there. Rule: operations touch only their own
      // field — every branch below spreads `fields` and overwrites exactly one literal key.
      fields = applyOperation(fields, field, operation, now);
    } else {
      suggestions.push({
        field,
        value: toGenericValue(field, operation.value),
        evidence: operation.evidence,
        confidence: operation.confidence,
      });
    }
  }

  return { fields, suggestions };
}

/** A suggestion the visitor accepted: promoted into the field as `'voice'`-sourced (it did, after
 * all, come from their own words) and removed from the suggestion list by the caller. */
export function acceptSuggestion(
  current: ProjectFormState,
  suggestion: FieldSuggestion,
  now: number,
): ProjectFormState {
  const base = { source: 'voice' as const, confidence: suggestion.confidence, evidence: suggestion.evidence, updatedAt: now };
  switch (suggestion.field) {
    case 'fullName':
      return { ...current, fullName: { ...base, value: asString(suggestion.value) } };
    case 'email':
      return { ...current, email: { ...base, value: asString(suggestion.value) } };
    case 'companyName':
      return { ...current, companyName: { ...base, value: asString(suggestion.value) } };
    case 'description':
      return { ...current, description: { ...base, value: asString(suggestion.value) } };
    case 'projectType':
      return { ...current, projectType: { ...base, value: asProjectType(suggestion.value) } };
    case 'budget':
      return { ...current, budget: { ...base, value: asBudget(suggestion.value) } };
  }
}

/** `undo` on an AI-filled field's badge: restores the empty state and marks the field `'manual'`
 * so a later voice mention never silently reclaims it — the visitor's undo is itself a decision. */
export function revertToManualEmpty(
  current: ProjectFormState,
  field: VoiceFillableField,
  now: number,
): ProjectFormState {
  const empty = { value: null, source: 'manual' as const, confidence: null, evidence: null, updatedAt: now };
  switch (field) {
    case 'fullName':
      return { ...current, fullName: empty };
    case 'email':
      return { ...current, email: empty };
    case 'companyName':
      return { ...current, companyName: empty };
    case 'description':
      return { ...current, description: empty };
    case 'projectType':
      return { ...current, projectType: empty };
    case 'budget':
      return { ...current, budget: empty };
  }
}

function applyOperation(
  state: ProjectFormState,
  field: VoiceFillableField,
  operation: VoiceOperationDto,
  now: number,
): ProjectFormState {
  const base = {
    source: 'voice' as const,
    confidence: operation.confidence,
    evidence: operation.evidence,
    updatedAt: now,
  };
  switch (field) {
    case 'fullName':
      return { ...state, fullName: { ...base, value: asString(operation.value) } };
    case 'email':
      return { ...state, email: { ...base, value: asString(operation.value) } };
    case 'companyName':
      return { ...state, companyName: { ...base, value: asString(operation.value) } };
    case 'description':
      return { ...state, description: { ...base, value: asString(operation.value) } };
    case 'projectType':
      return { ...state, projectType: { ...base, value: asProjectType(operation.value) } };
    case 'budget':
      return { ...state, budget: { ...base, value: asBudget(operation.value) } };
  }
}

function toGenericValue(field: VoiceFillableField, wireValue: VoiceOperationDto['value']): string | Budget | null {
  return field === 'budget' ? asBudget(wireValue) : asString(wireValue);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asProjectType(value: unknown): ProjectType | null {
  return typeof value === 'string' && PROJECT_TYPES.has(value) ? (value as ProjectType) : null;
}

function asBudget(value: unknown): Budget | null {
  if (value === null || typeof value !== 'object') {
    return null;
  }
  const range = (value as { range?: unknown }).range;
  const raw = (value as { raw?: unknown }).raw;
  return {
    range: typeof range === 'string' && BUDGET_RANGES.has(range) ? (range as BudgetRange) : null,
    raw: typeof raw === 'string' ? raw : null,
  };
}

