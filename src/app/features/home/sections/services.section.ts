import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../core/i18n/i18n.service';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { SectionSpyDirective } from '../../../shared/directives/section-spy';
import { ButtonComponent } from '../../../shared/ui/button.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { ContentStore } from '../../../core/content.store';

/** Section 4 — the service catalogue. */
@Component({
  selector: 'app-services-section',
  imports: [RouterLink, ButtonComponent, IconComponent, RevealDirective, SectionSpyDirective],
  templateUrl: './services.section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesSection {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly content = inject(ContentStore);
  protected readonly services = this.content.services;

  /**
   * `01`, `02`, … as an editorial index on each card.
   *
   * Formatted through `Intl` rather than by padding a string so the digits follow
   * the locale's numbering system. For `ar-MA` that is Latin digits — Morocco
   * writes Arabic with Western numerals — which is exactly the point: hard-coding
   * `padStart` would happen to be right here and wrong the moment a locale that
   * uses Arabic-Indic digits is added.
   */
  protected number(index: number): string {
    return new Intl.NumberFormat(this.i18n.meta().tag, {
      minimumIntegerDigits: 2,
      useGrouping: false,
    }).format(index + 1);
  }
}
