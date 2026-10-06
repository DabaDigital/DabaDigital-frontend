import { DOCUMENT } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { ContentStore } from '../content.store';
import { I18nService } from '../i18n/i18n.service';
import type { Locale } from '../i18n/locale';
import type { SocialLink } from '../models/content.model';
import { NOINDEX, SeoService } from './seo.service';

@Component({ template: '' })
class BlankPage {}

/** What a crawler reads in `<head>`. */
function head(): {
  title: string;
  robots: string | null | undefined;
  canonical: (string | null)[];
  hreflang: string[];
  structuredData: Record<string, unknown>[];
} {
  const document = TestBed.inject(DOCUMENT);
  return {
    title: document.title,
    robots: document.head.querySelector('meta[name="robots"]')?.getAttribute('content'),
    canonical: [...document.head.querySelectorAll('link[rel="canonical"]')].map((link) =>
      link.getAttribute('href'),
    ),
    hreflang: [...document.head.querySelectorAll('link[rel="alternate"][hreflang]')].map(
      (link) => `${link.getAttribute('hreflang')} ${link.getAttribute('href')}`,
    ),
    structuredData: [...document.head.querySelectorAll('script[type="application/ld+json"]')].map(
      (script) => JSON.parse(script.textContent ?? '{}') as Record<string, unknown>,
    ),
  };
}

/** A landing route in a test does not render `HomePage`, so the language is set by hand. */
async function visit(url: string, locale?: Locale): Promise<void> {
  if (locale) {
    TestBed.inject(I18nService).setLocale(locale, { persist: false });
  }
  await TestBed.inject(Router).navigateByUrl(url);
  TestBed.tick();
}

function studio(): Record<string, unknown> {
  const [data] = head().structuredData;
  const nodes = data['@graph'] as Record<string, unknown>[];
  return nodes.find((node) => node['@type'] === 'ProfessionalService') ?? {};
}

describe('SeoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: BlankPage, data: { locale: 'ar' } },
          { path: 'fr', component: BlankPage, data: { locale: 'fr' } },
          { path: 'en', component: BlankPage, data: { locale: 'en' } },
          { path: 'about', component: BlankPage, data: NOINDEX },
        ]),
      ],
    });
    TestBed.inject(SeoService);
  });

  it('describes a landing page in its own language, with all three versions linked', async () => {
    await visit('/fr', 'fr');

    const tags = head();
    expect(tags.title).toBe('Daba Digital — Agence web et digitale à Casablanca, Maroc');
    expect(tags.robots).toBe('index, follow, max-image-preview:large');
    expect(tags.canonical).toEqual(['https://www.dabadigital.ma/fr']);
    expect(tags.hreflang).toEqual([
      'ar https://www.dabadigital.ma/',
      'fr https://www.dabadigital.ma/fr',
      'en https://www.dabadigital.ma/en',
      'x-default https://www.dabadigital.ma/',
    ]);
    expect(tags.structuredData).toHaveLength(1);
    expect(studio()['name']).toBe('Daba Digital');
  });

  it('follows a language change with one set of tags, never a second', async () => {
    await visit('/fr', 'fr');
    await visit('/', 'ar');

    const tags = head();
    expect(tags.canonical).toEqual(['https://www.dabadigital.ma/']);
    expect(tags.hreflang).toHaveLength(4);
    expect(tags.structuredData).toHaveLength(1);
    const nodes = tags.structuredData[0]['@graph'] as Record<string, unknown>[];
    expect(nodes.find((node) => node['@type'] === 'WebPage')?.['inLanguage']).toBe('ar');
  });

  it('keeps a page that asks for it out of search results, with no language alternates', async () => {
    await visit('/fr', 'fr');
    await visit('/about?ref=x#top');

    const tags = head();
    expect(tags.robots).toBe('noindex, follow');
    expect(tags.canonical).toEqual(['https://www.dabadigital.ma/about']);
    expect(tags.hreflang).toEqual([]);
    expect(tags.structuredData).toEqual([]);
  });

  /** `https://mailto:contact@…` once came out of the admin: it must not claim a profile. */
  it('lists only real web profiles as the studio elsewhere', async () => {
    const store = TestBed.inject(ContentStore);
    const link = (id: string, url: string): SocialLink => ({
      id,
      name: id,
      url,
      icon: 'instagram',
      icon_url: '',
      status: 'published',
      position: 0,
    });
    store.content.update((content) => ({
      ...content,
      social: [
        link('instagram', 'https://www.instagram.com/dabadigital_/'),
        link('mail', 'https://mailto:contact@dabadigital.ma'),
        link('plain', 'http://insecure.example.com'),
      ],
    }));

    await visit('/en', 'en');

    expect(studio()['sameAs']).toEqual(['https://www.instagram.com/dabadigital_/']);
  });
});
