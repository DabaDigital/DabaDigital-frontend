import { Injectable, signal } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private instance: SupabaseClient | null = null;
  readonly configured = signal(false);

  async initialize(): Promise<void> {
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
      const { createClient } = await import('@supabase/supabase-js');
      this.instance = createClient(url, publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
      this.configured.set(true);
    } catch {
      // Public seed content stays available; sign-in explains missing configuration.
    }
  }

  get client(): SupabaseClient {
    if (!this.instance) throw new Error('supabase_not_configured');
    return this.instance;
  }
}
