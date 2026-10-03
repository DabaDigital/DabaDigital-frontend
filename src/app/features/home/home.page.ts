import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { I18nService } from '../../core/i18n/i18n.service';
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
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    /*
     * The document title and descriptions follow the language, which the
     * router's title strategy cannot do — a route `title` is resolved once per
     * navigation, and the language changes without one. This route therefore
     * declares no `title` in `app.routes.ts`; `DefaultTitleStrategy` leaves the
     * title alone for a route without one, so there is nothing to fight with.
     *
     * `index.html` carries the same tags in English for crawlers that do not
     * run scripts.
     */
    effect(() => {
      const title = this.i18n.t('meta.title');
      const description = this.i18n.t('meta.description');
      this.title.setTitle(title);
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: title });
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({ property: 'og:locale', content: this.i18n.meta().tag.replace('-', '_') });
      this.meta.updateTag({ name: 'twitter:title', content: title });
      this.meta.updateTag({ name: 'twitter:description', content: description });
    });
  }
}
