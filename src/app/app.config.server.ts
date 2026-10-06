import {
  type ApplicationConfig,
  inject,
  mergeApplicationConfig,
  provideAppInitializer,
} from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { SupabaseService } from './core/api/supabase.service';
import { ContentStore } from './core/content.store';

/**
 * The app as `ng build` prerenders it (see `app.routes.server.ts`).
 *
 * One addition to the browser config: before a page is rendered, the live content is read
 * from Supabase, so the HTML a crawler receives lists the real services, projects and
 * team rather than the seed. If that read fails, the initializer throws and the build
 * fails with it (see `ContentStore.prerender`).
 */
const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideAppInitializer(() => {
      // Both before the first `await`: `inject` only works synchronously.
      const supabase = inject(SupabaseService);
      const content = inject(ContentStore);
      return supabase.initialize().then(() => content.prerender());
    }),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
