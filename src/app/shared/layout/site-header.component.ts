import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../core/i18n/i18n.service';
import type { MessageKey } from '../../core/i18n/messages/ar';
import { SectionSpyService } from '../directives/section-spy';
import { ButtonComponent } from '../ui/button.component';
import { IconComponent } from '../ui/icon.component';
import { LanguageMenuComponent } from '../ui/language-menu.component';
import { LogoComponent } from '../ui/logo.component';
import { ThemeToggleComponent } from '../ui/theme-toggle.component';

export interface SectionLink {
  /** Matches the `id` of the `<section>` it scrolls to, and the router fragment. */
  readonly id: string;
  readonly label: string;
}

/** The four navigable sections. The banner is not one — the logo goes there. */
const SECTION_IDS: readonly { id: string; key: MessageKey }[] = [
  { id: 'about', key: 'nav.about' },
  { id: 'projects', key: 'nav.projects' },
  { id: 'services', key: 'nav.services' },
  { id: 'contact', key: 'nav.contact' },
];

@Component({
  selector: 'app-site-header',
  imports: [
    RouterLink,
    ButtonComponent,
    IconComponent,
    LogoComponent,
    ThemeToggleComponent,
    LanguageMenuComponent,
  ],
  templateUrl: './site-header.component.html',
  styles: `
    /*
     * The header gains its border and shadow only once the page has scrolled, so
     * it sits flush against the banner at rest. Driven by a scroll-progress
     * timeline rather than a scroll listener: no JS on the scroll path, and no
     * layout read per frame.
     *
     * Chrome and Edge support this today; everywhere else the header simply keeps
     * its resting state, which is a complete design on its own.
     */
    @supports (animation-timeline: scroll()) {
      @media (prefers-reduced-motion: no-preference) {
        .site-header {
          animation: header-lift linear both;
          animation-timeline: scroll(root block);
          /* Reaches its final state over the first 5rem of scroll. */
          animation-range: 0 5rem;
        }

        @keyframes header-lift {
          to {
            border-block-end-color: var(--border-subtle);
            box-shadow: var(--shadow-sm);
          }
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderComponent {
  protected readonly i18n = inject(I18nService);
  private readonly spy = inject(SectionSpyService);

  protected readonly t = this.i18n.t;

  /** Single source of truth for the mobile menu — the button label, `aria-expanded` and the panel all read it. */
  protected readonly menuOpen = signal(false);

  protected readonly links = computed<readonly SectionLink[]>(() =>
    SECTION_IDS.map(({ id, key }) => ({ id, label: this.t(key) })),
  );

  /** Empty on any route without landing sections, so nothing is marked current. */
  protected readonly activeSection = this.spy.active;

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
