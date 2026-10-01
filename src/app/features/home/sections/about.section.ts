import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../core/i18n/i18n.service';
import { injectMotion } from '../../../core/motion/motion.service';
import { SectionSpyDirective } from '../../../shared/directives/section-spy';
import { SplitWordsPipe } from '../../../shared/pipes/split-words.pipe';
import { ButtonComponent } from '../../../shared/ui/button.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { PILLARS, indexLabel } from '../home.content';
import { aboutMotion } from '../home.motion';

@Component({
  selector: 'app-about-section',
  imports: [RouterLink, ButtonComponent, IconComponent, SectionSpyDirective, SplitWordsPipe],
  templateUrl: './about.section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutSection {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly pillars = PILLARS;
  /** Native names, never translated: "Français" means the same thing on every page. */
  protected readonly languages = this.i18n.available;
  /** Where each language chip floats around the globe — logical insets, so RTL mirrors them. */
  protected readonly orbit = [
    'inset-s-[4%] top-[12%] [--float-delay:-2s]',
    'inset-e-0 top-[46%] [--float-delay:-4s]',
    'inset-s-[16%] bottom-[8%]',
  ];

  constructor() {
    injectMotion(
      (kit, host) => aboutMotion(kit, host.querySelector('section') ?? host),
      () => this.i18n.locale(),
    );
  }

  protected index(position: number): string {
    return indexLabel(position, this.i18n.meta().tag);
  }
}
