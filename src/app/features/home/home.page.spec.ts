import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { I18nService } from '../../core/i18n/i18n.service';
import { HomePage } from './home.page';

async function render(): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(HomePage);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('HomePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    TestBed.inject(I18nService).setLocale('en');
  });

  /**
   * The accent span inside the h1 splits the heading into three text nodes. The
   * accessible name has to survive that, because `e2e/navigation.spec.ts` matches
   * the h1 by its exact name — and so does anyone using a screen reader.
   */
  it('keeps the h1 accessible name intact despite the accent span', async () => {
    const host = await render();
    const heading = host.querySelector('h1');

    expect(heading?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Build. Launch. Grow.');
  });

  it('offers both hero calls to action', async () => {
    const host = await render();
    const hrefs = [...host.querySelectorAll('a')].map((a) => a.getAttribute('href'));

    expect(hrefs).toContain('/#contact');
    expect(hrefs).toContain('/#projects');
  });

  it('gives every service teaser a card with an icon and a heading', async () => {
    const host = await render();
    const cards = [...host.querySelectorAll('#services li')].filter((li) =>
      li.querySelector(':scope > span > app-icon'),
    );

    expect(cards).toHaveLength(6);
    for (const card of cards) {
      expect(card.querySelector('h3')?.textContent?.trim()).toBeTruthy();
    }
  });

  it('links each featured project to its portfolio slug', async () => {
    const host = await render();
    const hrefs = [...host.querySelectorAll('a.card-link')].map((a) => a.getAttribute('href'));

    expect(hrefs).toEqual([
      '/portfolio/neural-ledger',
      '/portfolio/aura-commerce',
      '/portfolio/atlas-cargo',
      '/portfolio/souk-connect',
      '/portfolio/zellige-studio',
      '/portfolio/riad-atlas',
    ]);
  });

  /**
   * A project card is one link, not three. Tag chips and the summary must stay
   * outside the anchor so its accessible name is only the project name.
   */
  it('gives each project card a single link named after the project', async () => {
    const host = await render();
    const links = [...host.querySelectorAll<HTMLAnchorElement>('a.card-link')];

    expect(links.map((a) => a.textContent?.trim())).toEqual([
      'Neural Ledger',
      'Aura Commerce',
      'Atlas Cargo',
      'Souk Connect',
      'Zellige Studio',
      'Riad Atlas',
    ]);
  });

  /** Decorative artwork must never reach the accessibility tree. */
  it('hides the decorative artwork and glows from assistive technology', async () => {
    const host = await render();

    for (const glow of host.querySelectorAll('.ambient-glow')) {
      expect(glow.getAttribute('aria-hidden')).toBe('true');
    }

    for (const svg of host.querySelectorAll('svg')) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    }
  });

  /** Sequential h1 → h2 → h3, no skipped level. */
  it('keeps the heading hierarchy sequential', async () => {
    const host = await render();
    const levels = [...host.querySelectorAll('h1, h2, h3')].map((h) => Number(h.tagName[1]));

    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });
});
