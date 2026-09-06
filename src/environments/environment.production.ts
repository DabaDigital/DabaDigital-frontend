import type { AppEnvironment } from './environment.model';

/**
 * Point `apiBaseUrl` at the deployed API before shipping. Its `FRONTEND_ORIGIN`
 * must list this origin for CORS, and the site must be served over HTTPS or the
 * microphone is unavailable.
 */
export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: 'https://api.dabadigital.ma/api/v1',
  voice: {
    enabled: true,
    chunkMs: 4000,
    maxRecordingMs: 120000,
    minConfidence: 0.6,
    defaultLanguage: 'auto',
  },
};
