import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { I18nService } from '../../../core/i18n/i18n.service';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { SectionSpyDirective } from '../../../shared/directives/section-spy';
import { IconComponent } from '../../../shared/ui/icon.component';
import { PILLARS } from '../home.content';

/** Section 2 — who the studio is and how it works. */
@Component({
  selector: 'app-about-section',
  imports: [IconComponent, RevealDirective, SectionSpyDirective],
  templateUrl: './about.section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutSection {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly pillars = PILLARS;
}
