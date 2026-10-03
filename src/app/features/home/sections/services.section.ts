import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ContentStore } from '../../../core/content.store';
import { I18nService } from '../../../core/i18n/i18n.service';
import { injectMotion } from '../../../core/motion/motion';
import { SectionSpyDirective } from '../../../shared/directives/section-spy';
import { ButtonComponent } from '../../../shared/ui/button.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { ServiceCardComponent } from '../components/service-card.component';
import { servicesMotion } from '../home.motion';

/** How many services the landing page shows before "Explore all services". */
const FEATURED_COUNT = 4;

/**
 * Section 3 — the service catalogue.
 *
 * `featured` (the landing page): a heading row with a link to `/services`, and
 * the first four services. Off (the `/services` page, which has its own page
 * header): every published service, nothing else.
 */
@Component({
  selector: 'app-services-section',
  imports: [RouterLink, ButtonComponent, IconComponent, ServiceCardComponent, SectionSpyDirective],
  templateUrl: './services.section.html',
  styleUrl: './services.section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesSection {
  readonly featured = input(true);

  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly content = inject(ContentStore);

  protected readonly shown = computed(() => {
    const services = this.content.services();
    return this.featured() ? services.slice(0, FEATURED_COUNT) : services;
  });

  constructor() {
    injectMotion((kit) => servicesMotion(kit));
  }
}
