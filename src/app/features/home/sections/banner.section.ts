import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../core/i18n/i18n.service';
import { injectMotion } from '../../../core/motion/motion';
import { SectionSpyDirective } from '../../../shared/directives/section-spy';
import { ButtonComponent } from '../../../shared/ui/button.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { NightVisualComponent } from '../components/night-visual.component';
import { bannerMotion } from '../home.motion';

/**
 * Section 1 — the banner: three beats of type, one object in the dark.
 *
 * Everything paints with the first frame. The entrance timeline (see
 * `bannerMotion`) sets its starting states before that frame and plays from
 * there; under reduced motion it never runs, and the page is simply there.
 */
@Component({
  selector: 'app-banner-section',
  imports: [RouterLink, ButtonComponent, IconComponent, NightVisualComponent, SectionSpyDirective],
  templateUrl: './banner.section.html',
  styleUrl: './banner.section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerSection {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  private readonly visual = viewChild.required(NightVisualComponent);

  constructor() {
    injectMotion((kit) => bannerMotion(kit, this.visual()));
  }
}
