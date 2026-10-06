import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';
import type { Locale } from '../../core/i18n/locale';
import { AboutSection } from './sections/about.section';
import { BannerSection } from './sections/banner.section';
import { ContactSection } from './sections/contact.section';
import { CtaSection } from './sections/cta.section';
import { FeaturedWorkSection } from './sections/featured-work.section';
import { ServicesSection } from './sections/services.section';
import { TeamSection } from './sections/team.section';

/**
 * The landing page: seven sections, each owning its own content and state, so
 * the form in Contact and the cards in Featured Work cannot reach each other and
 * any one of them can move to another route without untangling anything.
 *
 * It lives at three URLs, one per language (`/`, `/fr`, `/en` — see `app.routes.ts`).
 * Its title, description and structured data are `SeoService`'s.
 */
@Component({
  selector: 'app-home-page',
  imports: [
    BannerSection,
    FeaturedWorkSection,
    ServicesSection,
    AboutSection,
    TeamSection,
    CtaSection,
    ContactSection,
  ],
  templateUrl: './home.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly i18n = inject(I18nService);

  /**
   * The language this URL is in, from the route's `data` (`withComponentInputBinding`).
   * Undefined when the page is rendered outside the router, as in unit tests.
   */
  readonly locale = input<Locale>();

  constructor() {
    // The URL decides the language. Moving between `/`, `/fr` and `/en` (the language menu,
    // Back) reuses this component (`LandingReuseStrategy`), so only this input changes.
    // `untracked`: `setLocale` reads the locale signal it writes, and an effect must not
    // depend on its own write. Not persisted — arriving on `/fr` is not a choice.
    effect(() => {
      const locale = this.locale();
      if (locale) {
        untracked(() => this.i18n.setLocale(locale, { persist: false }));
      }
    });
  }
}
