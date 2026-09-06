import type { AppEnvironment } from './environment.model';

/**
 * Default environment — local development against a backend on :3000.
 * Replaced by `environment.development.ts` / `environment.production.ts`
 * through `fileReplacements` in angular.json.
 */
export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api/v1',
  voice: {
    enabled: true,
    chunkMs: 4000,
    maxRecordingMs: 120000,
    minConfidence: 0.6,
    defaultLanguage: 'auto',
  },
};
