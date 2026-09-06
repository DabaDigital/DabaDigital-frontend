/**
 * The form's provenance layer. Every field carries where its value came from —
 * that is what powers the ✨ badge and the protection of manual edits.
 *
 * The enums mirror the backend's serializers (`../DabaDigital-backend`
 * README § Data model). Changing one is a cross-repo change.
 */

export type ProjectType =
  'website' | 'ecommerce' | 'web_app' | 'mobile_app' | 'redesign' | 'api' | 'other';

export type ServiceKey =
  | 'web_development'
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'ecommerce'
  | 'ui_ux_design'
  | 'api_development'
  | 'maintenance'
  | 'performance'
  | 'ai_integration';

export type DeadlineUnit = 'days' | 'weeks' | 'months';

export interface Budget {
  amount: number;
  /** Defaults to MAD server-side. */
  currency: string;
  /** The visitor's own words — "20 000 dirhams". */
  raw: string | null;
}

export interface Deadline {
  value: number;
  unit: DeadlineUnit;
  raw: string | null;
}

export type FieldSource = 'empty' | 'voice' | 'manual';

export interface FieldState<T> {
  value: T | null;
  source: FieldSource;
  /** Voice only. */
  confidence: number | null;
  /** The words that produced it — shown on hover. */
  evidence: string | null;
  updatedAt: number;
}

export interface ProjectFormState {
  projectType: FieldState<ProjectType>;
  budget: FieldState<Budget>;
  deadline: FieldState<Deadline>;
  technologies: FieldState<string[]>;
  description: FieldState<string>;
  // Contact block — MVP: manual only.
  fullName: FieldState<string>;
  companyName: FieldState<string>;
  email: FieldState<string>;
  phone: FieldState<string>;
}

/** The keys a voice operation may target. The contact block is not one of them in the MVP. */
export type VoiceFillableField =
  'projectType' | 'budget' | 'deadline' | 'technologies' | 'description';

export function emptyField<T>(): FieldState<T> {
  return { value: null, source: 'empty', confidence: null, evidence: null, updatedAt: 0 };
}

export function emptyProjectFormState(): ProjectFormState {
  return {
    projectType: emptyField<ProjectType>(),
    budget: emptyField<Budget>(),
    deadline: emptyField<Deadline>(),
    technologies: emptyField<string[]>(),
    description: emptyField<string>(),
    fullName: emptyField<string>(),
    companyName: emptyField<string>(),
    email: emptyField<string>(),
    phone: emptyField<string>(),
  };
}
