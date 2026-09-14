export type VoiceLanguage = 'auto' | 'fr' | 'en' | 'ar';

export interface AppEnvironment {
  readonly production: boolean;
  /** Base path of the Rails API, e.g. `http://localhost:3000/api/v1`. */
  readonly apiBaseUrl: string;
  readonly voice: {
    /** Master switch. With `false` the voice panel never renders and the manual form is the whole page. */
    readonly enabled: boolean;
    /** How often a turn is sent while recording. The latency/cost dial. */
    readonly chunkMs: number;
    /** Hard stop on a single recording. */
    readonly maxRecordingMs: number;
    /** Below this, a value is shown as a suggestion and never auto-filled. Mirrors the backend's `AI_MIN_CONFIDENCE`. */
    readonly minConfidence: number;
    readonly defaultLanguage: VoiceLanguage;
  };
}
