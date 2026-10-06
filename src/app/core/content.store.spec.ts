import { TransferState, makeStateKey, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ContentApi } from './api/content.api';
import { SupabaseService } from './api/supabase.service';
import { ContentStore, seedContent } from './content.store';
import type { SiteContent } from './models/content.model';

/** The key the store hands the build's content over with — by name, as the page carries it. */
const PRERENDERED = makeStateKey<SiteContent>('dabadigital.content');

function live(): SiteContent {
  const seed = seedContent();
  return {
    ...seed,
    projects: seed.projects.map((project) => ({ ...project, name: `Live ${project.name}` })),
  };
}

describe('ContentStore', () => {
  /**
   * Hydration adopts the cards the build rendered. Starting from the seed instead, the
   * page would hold different projects from the ones the store describes.
   */
  it('starts from the content a prerendered page carries', () => {
    const content = live();
    TestBed.inject(TransferState).set(PRERENDERED, content);

    const store = TestBed.inject(ContentStore);

    expect(store.content()).toEqual(content);
    expect(store.loaded()).toBe(true);
  });

  it('starts from the seed anywhere else', () => {
    const store = TestBed.inject(ContentStore);

    expect(store.content().projects.map((project) => project.slug)).toEqual(
      seedContent().projects.map((project) => project.slug),
    );
  });

  /** The seed's placeholder projects must never be what a crawler indexes. */
  it('refuses to prerender without the live content', async () => {
    const store = TestBed.inject(ContentStore);

    await expect(store.prerender()).rejects.toThrow('supabase-config.json');
  });

  it('prerenders from the live content, and hands it to the browser in the page', async () => {
    const content = live();
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { configured: signal(true) } },
        { provide: ContentApi, useValue: { load: () => Promise.resolve(content) } },
      ],
    });
    const store = TestBed.inject(ContentStore);

    await store.prerender();

    expect(store.content()).toEqual(content);
    expect(store.loaded()).toBe(true);
    expect(TestBed.inject(TransferState).get(PRERENDERED, null)).toEqual(content);
  });
});
