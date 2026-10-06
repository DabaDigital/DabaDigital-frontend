import { Injectable, signal } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';

/** A failed anonymous read, carrying PostgREST's error code (`PGRST205`, …) like the client's errors do. */
export class RestError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'RestError';
  }
}

/** What `select()` resolves to: the same `{ data, error }` pair a client query does. */
export interface RestResult<T> {
  readonly data: T[] | null;
  readonly error: RestError | null;
}

/**
 * Supabase in two steps, so that nothing waits on it before the first paint.
 *
 * 1. `initialize()` is the app initializer. It reads `/supabase-config.json` and
 *    nothing more — one small same-origin request — so `configured` is settled
 *    before the first component asks.
 * 2. `connect()` loads `@supabase/supabase-js` (a ~240 kB chunk) and creates the
 *    client on first use: signing in, the dashboard, sending a message. Reading
 *    published content needs none of that — `select()` does it with a plain GET —
 *    so a visitor to the public site never downloads the library at all.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private config: { readonly url: string; readonly publishableKey: string } | null = null;
  private connection: Promise<SupabaseClient> | null = null;
  private initializing: Promise<void> | null = null;
  readonly configured = signal(false);

  /**
   * Once per app, however many callers: the browser's app initializer, and at build time
   * the prerender initializer too (`app.config.server.ts`), which needs the config before
   * it can read the live content. During `ng build` the relative URL still works — the
   * prerenderer answers same-origin requests for files in `public/` from disk.
   */
  initialize(): Promise<void> {
    this.initializing ??= this.readConfig();
    return this.initializing;
  }

  private async readConfig(): Promise<void> {
    try {
      const response = await fetch('/supabase-config.json', { cache: 'no-store' });
      if (!response.ok) return;
      const config: unknown = await response.json();
      if (
        !config ||
        typeof config !== 'object' ||
        !('url' in config) ||
        !('publishableKey' in config)
      )
        return;
      const { url, publishableKey } = config;
      if (typeof url !== 'string' || typeof publishableKey !== 'string' || !url || !publishableKey)
        return;
      if (!url.startsWith('https://') && !/^http:\/\/(localhost|127\.0\.0\.1):/.test(url)) return;
      // A server secret must never be used to initialize this browser client.
      if (!publishableKey.startsWith('sb_publishable_')) return;
      this.config = { url, publishableKey };
      this.configured.set(true);
      // An invite or recovery link lands with its tokens in the URL, and only the client can
      // consume them (`detectSessionInUrl`), so on such a visit it is created straight away.
      // Never at build time: the prerenderer has no `location`, and no visitor's tokens.
      if (
        typeof location !== 'undefined' &&
        /[#&?](access_token|refresh_token|error_description|code)=/.test(location.href)
      ) {
        void this.connect().catch(() => undefined);
      }
    } catch {
      // Public seed content stays available; sign-in explains missing configuration.
    }
  }

  /** The client, loaded and created on first use. Rejects when Supabase is not configured. */
  connect(): Promise<SupabaseClient> {
    const config = this.config;
    if (!config) return Promise.reject(new Error('supabase_not_configured'));
    this.connection ??= import('@supabase/supabase-js').then(
      ({ createClient }) =>
        createClient(config.url, config.publishableKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        }),
      (error: unknown) => {
        // A chunk that failed to load (a dropped connection, a redeploy) is retried next time.
        this.connection = null;
        throw error;
      },
    );
    return this.connection;
  }

  /**
   * Reads rows anonymously, without the client: `GET /rest/v1/<table>?<query>`.
   *
   * The key travels as the `apikey` query parameter, which Supabase accepts in
   * place of the header. With no custom header the GET is a CORS "simple"
   * request, so it costs no preflight either — the client sends four custom
   * headers, and with them an OPTIONS round trip before every read.
   *
   * Row-level security sees an anonymous visitor: this is for public data only.
   */
  async select<T>(table: string, query: Readonly<Record<string, string>>): Promise<RestResult<T>> {
    const config = this.config;
    if (!config) throw new Error('supabase_not_configured');
    const params = new URLSearchParams({ ...query, apikey: config.publishableKey });
    const response = await fetch(`${config.url}/rest/v1/${table}?${params}`);
    const body: unknown = await response.json().catch(() => null);
    if (response.ok && Array.isArray(body)) return { data: body as T[], error: null };
    // PostgREST explains a refusal as `{ code, message, … }`; a gateway error may not.
    const fields: { code?: unknown; message?: unknown } =
      body && typeof body === 'object' ? body : {};
    return {
      data: null,
      error: new RestError(
        typeof fields.message === 'string' ? fields.message : response.statusText,
        typeof fields.code === 'string' ? fields.code : String(response.status),
      ),
    };
  }
}
