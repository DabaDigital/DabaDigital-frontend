import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { I18nService } from '../../core/i18n/i18n.service';
import { AboutSection } from './sections/about.section';
import { BannerSection } from './sections/banner.section';
import { ContactSection } from './sections/contact.section';
import { ProjectsSection } from './sections/projects.section';
import { ServicesSection } from './sections/services.section';

/**
 * The landing page: five sections, in the order a first-time visitor needs them.
 *
 * The page itself holds no content and no state — each section owns its own, so
 * the filter in Projects and the form in Contact cannot reach each other, and any
 * one of them can move to another route without untangling anything.
 */
@Component({
  selector: 'app-home-page',
  imports: [BannerSection, AboutSection, ProjectsSection, ServicesSection, ContactSection],
  templateUrl: './home.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly i18n = inject(I18nService);
  private readonly title = inject(Title);

  constructor() {
    /*
     * The document title follows the language, which the router's title strategy
     * cannot do — a route `title` is resolved once per navigation, and the
     * language changes without one.
     *
     * This route deliberately declares no `title` in `app.routes.ts`:
     * `DefaultTitleStrategy` leaves the title untouched when a route has none,
     * so there is nothing here to fight with. The other routes still set theirs.
     */
    effect(() => this.title.setTitle(this.i18n.t('meta.title')));
  }
}
