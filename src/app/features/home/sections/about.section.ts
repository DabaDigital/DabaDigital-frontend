import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { I18nService } from '../../../core/i18n/i18n.service';
import { injectMotion } from '../../../core/motion/motion';
import { SectionSpyDirective } from '../../../shared/directives/section-spy';
import { OfficeArtComponent } from '../components/office-art.component';
import { ABOUT_IMAGE, STATS } from '../home.content';
import { aboutMotion } from '../home.motion';

/**
 * Section 4 — who the studio is: the statement, the picture (`ABOUT_IMAGE`,
 * the wordmark on its blue) and three figures — in that order on a phone, and
 * on a wide screen the picture on one side, the statement and figures on the
 * other. Editorial, not a grid of cards.
 */
@Component({
  selector: 'app-about-section',
  imports: [OfficeArtComponent, SectionSpyDirective],
  templateUrl: './about.section.html',
  styleUrl: './about.section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutSection {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly image = ABOUT_IMAGE;
  protected readonly stats = STATS;

  constructor() {
    injectMotion((kit) => aboutMotion(kit));
  }
}
