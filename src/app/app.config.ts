import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';

import { routes } from './app.routes';
import { SupabaseService } from './core/api/supabase.service';
import { LandingReuseStrategy } from './core/routing/landing-reuse.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => inject(SupabaseService).initialize()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    { provide: RouteReuseStrategy, useExisting: LandingReuseStrategy },
    provideHttpClient(withFetch()),
    // The landing pages arrive prerendered (`app.routes.server.ts`): Angular adopts that DOM
    // instead of drawing the page a second time, and clicks made before it is ready are
    // replayed rather than lost. Pages rendered in the browser (`index.csr.html`) carry no
    // hydration data and simply render as before.
    provideClientHydration(withEventReplay()),
  ],
};
