import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../core/i18n/i18n.service';
import { injectMotion } from '../../../core/motion/motion.service';
import { SectionSpyDirective } from '../../../shared/directives/section-spy';
import { SplitWordsPipe } from '../../../shared/pipes/split-words.pipe';
import { ButtonComponent } from '../../../shared/ui/button.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { PROCESS_STEPS, indexLabel } from '../home.content';
import { processMotion } from '../home.motion';

/**
 * Section 5 — how an engagement runs, in five steps.
 *
 * An ordered list, because the order is the content. A path runs through the
 * five nodes — across on wide screens, down the inline-start edge on narrow
 * ones — and, with motion, draws itself as the page scrolls while each node
 * lights up as the path reaches it. Without motion the path is simply drawn
 * and every step is reached: the static design is the finished journey.
 *
 * Not in the header navigation (the header links the four sections a visitor
 * looks for); it registers with the section spy anyway, so no header link
 * claims to be current while this section is on screen.
 */
@Component({
  selector: 'app-process-section',
  imports: [RouterLink, ButtonComponent, IconComponent, SectionSpyDirective, SplitWordsPipe],
  templateUrl: './process.section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessSection {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly steps = PROCESS_STEPS;

  constructor() {
    injectMotion(
      (kit, host) => processMotion(kit, host.querySelector('section') ?? host),
      () => this.i18n.locale(),
    );
  }

  protected index(position: number): string {
    return indexLabel(position, this.i18n.meta().tag);
  }
}
