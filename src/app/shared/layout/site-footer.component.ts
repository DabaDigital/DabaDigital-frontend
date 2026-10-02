import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ContentStore } from '../../core/content.store';
import { I18nService } from '../../core/i18n/i18n.service';
import type { MessageKey } from '../../core/i18n/messages/ar';
import { IconComponent } from '../ui/icon.component';
import { LogoComponent } from '../ui/logo.component';

const FOOTER_SECTIONS: readonly { id: string; key: MessageKey }[] = [
  { id: 'about', key: 'nav.about' },
  { id: 'projects', key: 'nav.projects' },
  { id: 'services', key: 'nav.services' },
  { id: 'contact', key: 'nav.contact' },
];

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink, LogoComponent, IconComponent],
  templateUrl: './site-footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooterComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly content = inject(ContentStore);

  protected readonly sections = computed(() =>
    FOOTER_SECTIONS.map(({ id, key }) => ({ id, label: this.t(key) })),
  );

  /**
   * Formatted for the locale, not stringified: `2026` in French and English, and
   * whatever the `ar-MA` calendar renders for Arabic. A bare `getFullYear()` in
   * an Arabic sentence is a Latin number dropped into RTL text.
   */
  protected readonly year = computed(() =>
    new Intl.NumberFormat(this.i18n.meta().tag, { useGrouping: false }).format(
      new Date().getFullYear(),
    ),
  );
}
