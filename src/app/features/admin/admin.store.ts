import { Injectable, inject, signal } from '@angular/core';

import { ContentApi } from '../../core/api/content.api';
import type { ClientMessage, SiteContent } from '../../core/models/content.model';

const EMPTY: SiteContent = { projects: [], categories: [], services: [], social: [], contact: [] };

/**
 * The dashboard's working copy of the content and the inbox.
 *
 * Each section is its own route, so `AdminPage` is recreated on every sidebar click. Holding the
 * data here is what lets that click render at once instead of refetching six tables. It is reset
 * on sign-in and sign-out so one session never shows another's data.
 */
@Injectable({ providedIn: 'root' })
export class AdminStore {
  private readonly api = inject(ContentApi);
  readonly data = signal<SiteContent>(EMPTY);
  readonly messages = signal<ClientMessage[]>([]);
  /** True until the first load settles, so the page shows a spinner rather than an empty state. */
  readonly loading = signal(true);
  readonly loadError = signal(false);
  private loaded = false;
  private request: Promise<void> | null = null;

  /** Loads once per session; `force` refetches (the Refresh and Try again buttons). */
  load(force = false): Promise<void> {
    if (this.request) return this.request;
    if (this.loaded && !force) return Promise.resolve();
    this.loading.set(true);
    this.loadError.set(false);
    this.request = Promise.all([this.api.load(false), this.api.messages()])
      .then(([content, messages]) => {
        this.data.set(content);
        this.messages.set(messages);
        this.loaded = true;
      })
      .catch(() => this.loadError.set(true))
      .finally(() => {
        this.loading.set(false);
        this.request = null;
      });
    return this.request;
  }

  /**
   * Refetches the categories alone, so a project editor offers every category that
   * exists now, not only those present when the workspace loaded. A failure keeps
   * the list already held.
   */
  async refreshCategories(): Promise<void> {
    try {
      const categories = await this.api.categories();
      this.data.update((data) => ({ ...data, categories }));
    } catch {
      // The loaded list stays usable.
    }
  }

  reset(): void {
    this.data.set(EMPTY);
    this.messages.set([]);
    this.loading.set(true);
    this.loadError.set(false);
    this.loaded = false;
    this.request = null;
  }
}
