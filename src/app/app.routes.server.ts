import { RenderMode, type ServerRoute } from '@angular/ssr';

/**
 * What `ng build` renders ahead of time.
 *
 * The three landing pages (`LOCALE_HOME_PATH`) are prerendered into static HTML, each in
 * its own language, with the live content from Supabase, the meta tags and the JSON-LD
 * already in place. That HTML is what a search engine indexes before it ever runs the app,
 * and all an AI crawler (GPTBot, ClaudeBot, PerplexityBot…) ever reads: they do not execute
 * JavaScript. In the browser, Angular hydrates it instead of rendering it again.
 *
 * Everything else renders in the browser from `index.csr.html` (see `vercel.json`): the
 * admin needs a signed-in session, and the other pages are `noindex` for now (see
 * `app.routes.ts`). To prerender one of them later, add it here — and make sure its code
 * runs on the server: browser APIs only inside `afterNextRender`, or behind a check.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'fr', renderMode: RenderMode.Prerender },
  { path: 'en', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
