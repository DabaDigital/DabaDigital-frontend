import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../core/i18n/i18n.service';
import { SectionSpyDirective } from '../../../shared/directives/section-spy';
import { ButtonComponent } from '../../../shared/ui/button.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { HeroVisualComponent } from '../components/hero-visual.component';

/**
 * Section 1 — the banner.
 *
 * Deliberately the one section with no `appReveal` on its content: it is above
 * the fold, so a fade-in would delay the Largest Contentful Paint element behind
 * a JS-driven class change for no benefit. Everything here is painted at once.
 */
@Component({
  selector: 'app-banner-section',
  imports: [RouterLink, ButtonComponent, IconComponent, HeroVisualComponent, SectionSpyDirective],
  templateUrl: './banner.section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerSection {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
}
