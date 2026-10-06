import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { I18nService } from '../../core/i18n/i18n.service';
import { LOCALE_STORAGE_KEY } from '../../core/i18n/locale';
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
   * The three beats sit on three lines, and the caret after the last one is an
   * empty ornament. The accessible name has to survive both, because
   * `e2e/navigation.spec.ts` matches the h1 by its exact name — and so does
   * anyone using a screen reader.
   */
  it('keeps the h1 accessible name intact across its three lines', async () => {
    const host = await render();
    const headings = host.querySelectorAll('h1');

    expect(headings).toHaveLength(1);
    expect(headings[0].textContent?.replace(/\s+/g, ' ').trim()).toBe('Build. Launch. Grow.');
  });

  it('offers both banner calls to action', async () => {
    const host = await render();
    const hrefs = [...host.querySelectorAll('#banner a')].map((a) => a.getAttribute('href'));

    expect(hrefs).toContain('/en#contact');
    expect(hrefs).toContain('/en#projects');
  });

  /**
   * Each language has its own landing URL (`/`, `/fr`, `/en`). A link to `/` from the
   * English page would drop the visitor on the Arabic one.
   */
  it('points its links at the landing page in the language on screen', async () => {
    const i18n = TestBed.inject(I18nService);
    const fixture = TestBed.createComponent(HomePage);
    const host = fixture.nativeElement as HTMLElement;
    const contactLink = (): string | null | undefined =>
      host.querySelector('#banner a.hero__cta')?.getAttribute('href');

    i18n.setLocale('fr');
    fixture.detectChanges();
    expect(contactLink()).toBe('/fr#contact');

    i18n.setLocale('ar');
    fixture.detectChanges();
    expect(contactLink()).toBe('/#contact');
  });

  /** Arriving on `/fr` follows the URL; it is not a choice, so nothing is remembered. */
  it('takes its language from the route, without remembering it', async () => {
    const i18n = TestBed.inject(I18nService);
    localStorage.removeItem(LOCALE_STORAGE_KEY);
    const fixture = TestBed.createComponent(HomePage);

    fixture.componentRef.setInput('locale', 'fr');
    fixture.detectChanges();

    expect(i18n.locale()).toBe('fr');
    expect(
      fixture.nativeElement.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim(),
    ).toBe('Concevoir. Lancer. Grandir.');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull();
  });

  it('features the first three projects, each one link named after the project', async () => {
    const host = await render();
    const links = [...host.querySelectorAll<HTMLAnchorElement>('#projects a.card-link')];

    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/portfolio/nextgen',
      '/portfolio/le-maitre-du-sandwich',
      '/portfolio/casablanca-night',
    ]);
    // The category, the summary and the arrow stay outside the anchor.
    expect(links.map((a) => a.textContent?.trim())).toEqual([
      'NextGen',
      'Le Maître du Sandwich',
      'Casablanca Night',
    ]);
  });

  it('links to the full portfolio and the full service list', async () => {
    const host = await render();
    const hrefs = [...host.querySelectorAll('a')].map((a) => a.getAttribute('href'));

    expect(hrefs).toContain('/portfolio');
    expect(hrefs).toContain('/services');
  });

  it('gives each of the four services a card with an icon and a heading', async () => {
    const host = await render();
    const cards = [...host.querySelectorAll('#services [data-card]')];

    expect(cards).toHaveLength(4);
    for (const card of cards) {
      expect(card.querySelector('.service-card__icon app-icon')).toBeTruthy();
      expect(card.querySelector('h3')?.textContent?.trim()).toBeTruthy();
    }
  });

  /** The order is the page's argument — see the comment in `home.page.html`. */
  it('lays the sections out in order, the team between About and the closing call', async () => {
    const host = await render();

    expect([...host.children].map((child) => child.tagName.toLowerCase())).toEqual([
      'app-banner-section',
      'app-featured-work-section',
      'app-services-section',
      'app-about-section',
      'app-team-section',
      'app-cta-section',
      'app-contact-section',
    ]);
  });

  /** The phone reads the markup top to bottom, so the markup holds its order. */
  it('reads About as the statement, then the picture, then the figures', async () => {
    const host = await render();
    const parts = [...host.querySelectorAll('#about .about > *')].map((part) => part.className);

    expect(parts).toEqual(['about__intro', 'about__frame', 'about__stats']);
  });

  it('sends the closing call to action to the contact form', async () => {
    const host = await render();
    const cta = host.querySelector('app-cta-section');

    expect(cta?.querySelector('h2')?.textContent?.trim()).toBe('Ready to start your next project?');
    expect(cta?.querySelector('a')?.getAttribute('href')).toBe('/en#contact');
  });

  /** Decorative artwork must never reach the accessibility tree. */
  it('hides the 3D visuals and the drawn artwork from assistive technology', async () => {
    const host = await render();

    for (const visual of host.querySelectorAll('app-night-visual, app-office-art')) {
      expect(visual.getAttribute('aria-hidden')).toBe('true');
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
