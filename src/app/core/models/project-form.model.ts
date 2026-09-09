/**
 * The form's provenance layer for the Home page's Contact form — every field
 * carries where its value came from, which is what powers the ✨ badge and
 * the protection of manual edits.
 *
 * ⚠ This is the Home Contact form (`features/home/sections/contact.section.ts`),
 * not a separate `/start` page — see `../../../../Claude.md` § MVP scope and
 * `CLAUDE.md` § State of the repo. The six fields below are exactly this
 * form's fields; there is no dedicated deadline/technologies field — voice
 * extraction folds that detail into `description` prose instead.
 *
 * The enums mirror the backend's serializers (`../DabaDigital-backend`
 * README § API reference / `ProjectRequest`). Changing one is a cross-repo
 * change — see this file's own CLAUDE.md § Cross-repo.
 */

export type ProjectType =
  'website' | 'ecommerce' | 'web_app' | 'mobile_app' | 'redesign' | 'api' | 'other';

export type BudgetRange = 's' | 'm' | 'l' | 'xl';

export interface Budget {
  range: BudgetRange | null;
  /** The visitor's own words, or the label they saw — "20 000 dirhams", "M — 20k to 50k MAD". */
  raw: string | null;
}

/** `'empty'` → never touched. `'voice'` → last set by the assistant. `'manual'` → the visitor
 * typed it, which is permanent per field-merge.ts's manual-wins rule until they clear it themselves. */
export type FieldSource = 'empty' | 'voice' | 'manual';

export interface FieldState<T> {
  value: T | null;
  source: FieldSource;
  /** Voice only. */
  confidence: number | null;
  /** The words that produced it — shown on hover/on the badge. */
  evidence: string | null;
  updatedAt: number;
}

export interface ProjectFormState {
  fullName: FieldState<string>;
  email: FieldState<string>;
  companyName: FieldState<string>;
  projectType: FieldState<ProjectType>;
  budget: FieldState<Budget>;
  description: FieldState<string>;
}

/** Every field on this form is voice-fillable — unlike the original `/start`-page sketch, the
 * contact block is in scope here (see CLAUDE.md § State of the repo). */
export type VoiceFillableField = keyof ProjectFormState;

export const VOICE_FILLABLE_FIELDS: readonly VoiceFillableField[] = [
  'fullName',
  'email',
  'companyName',
  'projectType',
  'budget',
  'description',
];

export function emptyField<T>(): FieldState<T> {
  return { value: null, source: 'empty', confidence: null, evidence: null, updatedAt: 0 };
}

export function emptyProjectFormState(): ProjectFormState {
  return {
    fullName: emptyField<string>(),
    email: emptyField<string>(),
    companyName: emptyField<string>(),
    projectType: emptyField<ProjectType>(),
    budget: emptyField<Budget>(),
    description: emptyField<string>(),
  };
}
