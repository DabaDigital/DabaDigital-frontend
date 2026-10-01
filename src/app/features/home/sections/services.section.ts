import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ContentStore } from '../../../core/content.store';
import { I18nService } from '../../../core/i18n/i18n.service';
import { injectMotion } from '../../../core/motion/motion.service';
import { SectionSpyDirective } from '../../../shared/directives/section-spy';
import { SplitWordsPipe } from '../../../shared/pipes/split-words.pipe';
import { ButtonComponent } from '../../../shared/ui/button.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { indexLabel } from '../home.content';
import { servicesMotion } from '../home.motion';

/**
 * Section 4 — the service catalogue.
 *
 * On wide screens the heading column is sticky while the six disciplines scroll
 * past it, each lighting up as it crosses the middle of the viewport; the
 * tesseract of scene chapter 3 turns in the box reserved under the heading.
 * The section clips with `overflow-x: clip`, never `hidden` — a `hidden` box is
 * a scroll container, and `position: sticky` would stick to it instead of to
 * the viewport.
 */
@Component({
  selector: 'app-services-section',
  imports: [RouterLink, ButtonComponent, IconComponent, SectionSpyDirective, SplitWordsPipe],
  templateUrl: './services.section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesSection {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly content = inject(ContentStore);
  protected readonly services = this.content.services;

  constructor() {
    // The catalogue is editable content: a Supabase refresh can swap the rows.
    injectMotion(
      (kit, host) => servicesMotion(kit, host.querySelector('section') ?? host),
      () => [this.i18n.locale(), this.services()],
    );
  }

  protected index(position: number): string {
    return indexLabel(position, this.i18n.meta().tag);
  }
}
