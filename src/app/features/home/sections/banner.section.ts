import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../core/i18n/i18n.service';
import { injectMotion } from '../../../core/motion/motion.service';
import { SectionSpyDirective } from '../../../shared/directives/section-spy';
import { BrandIconComponent } from '../../../shared/ui/brand-icon.component';
import { ButtonComponent } from '../../../shared/ui/button.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { TOOLS } from '../home.content';
import { bannerMotion } from '../home.motion';

/** A headline word's closing full stop, which the design sets in the accent colour. */
const CLOSING_STOP = /[.。]$/u;

/**
 * Section 1 — the banner.
 *
 * Nothing here waits on JavaScript to be seen: the headline, the copy, the
 * globe and the figures all paint with the first frame. The entrance
 * choreography runs after Angular's first render but before the browser's first
 * paint, so it sets its starting states without a flash of the finished layout.
 *
 * The visual column — the globe and the four glass cards around it — is
 * decoration that restates the Services section, so it is `aria-hidden`.
 */
@Component({
  selector: 'app-banner-section',
  imports: [RouterLink, BrandIconComponent, ButtonComponent, IconComponent, SectionSpyDirective],
  templateUrl: './banner.section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerSection {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly tools = TOOLS;

  constructor() {
    // The entrance plays once per visit; a language switch rebuilds the rest.
    let intro = true;
    injectMotion(
      (kit, host) => {
        const teardown = bannerMotion(kit, host.querySelector('section') ?? host, { intro });
        intro = false;
        return teardown;
      },
      () => this.i18n.locale(),
    );
  }

  /** "Build." → "Build": the word, without the full stop the design colours separately. */
  protected stem(word: string): string {
    return word.replace(CLOSING_STOP, '');
  }

  /** "Build." → ".": the full stop alone, or nothing when a language ends without one. */
  protected stop(word: string): string {
    return CLOSING_STOP.exec(word)?.[0] ?? '';
  }
}
