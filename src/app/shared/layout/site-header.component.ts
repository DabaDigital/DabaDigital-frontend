import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../core/i18n/i18n.service';
import type { Locale } from '../../core/i18n/locale';
import { LocaleSwitchService } from '../../core/i18n/locale-switch.service';
import type { MessageKey } from '../../core/i18n/messages/ar';
import { SectionSpyService } from '../directives/section-spy';
import { ButtonComponent } from '../ui/button.component';
import { IconComponent } from '../ui/icon.component';
import { LanguageMenuComponent } from '../ui/language-menu.component';
import { LogoComponent } from '../ui/logo.component';

export interface SectionLink {
  /** Matches the `id` of the `<section>` it scrolls to, and the router fragment. */
  readonly id: string;
  readonly label: string;
}

/**
 * The navigable sections, in the order they appear on the page (`home.page.html`),
 * so the current-section marker only moves forward as the page scrolls down.
 * Home is the banner.
 */
const SECTION_IDS: readonly { id: string; key: MessageKey }[] = [
  { id: 'banner', key: 'nav.home' },
  { id: 'projects', key: 'nav.projects' },
  { id: 'services', key: 'nav.services' },
  { id: 'about', key: 'nav.about' },
  { id: 'team', key: 'nav.team' },
  { id: 'contact', key: 'nav.contact' },
];

/**
 * The site header and its full-screen menu.
 *
 * Transparent over the banner, it gains a night backdrop and a hairline once
 * the page scrolls (`scrolled`, driven by an IntersectionObserver on a sentinel
 * at the top of the document — nothing on the scroll path).
 *
 * The menu is a native `<dialog>` opened with `showModal()`: the browser makes
 * the rest of the page inert, traps focus inside, closes it on Escape and
 * returns focus to the button that opened it. `menuOpen` stays the single
 * source of truth — the dialog's own `close` event writes back to it, so a
 * close the browser initiated (Escape) cannot leave the two out of step.
 */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, ButtonComponent, IconComponent, LanguageMenuComponent, LogoComponent],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderComponent {
  protected readonly i18n = inject(I18nService);
  private readonly spy = inject(SectionSpyService);
  private readonly localeSwitch = inject(LocaleSwitchService);

  protected readonly t = this.i18n.t;
  /** The landing page in the language on screen: `/`, `/fr` or `/en`. */
  protected readonly home = this.i18n.homePath;

  protected readonly menuOpen = signal(false);
  /** True once the page has scrolled past its first few pixels. */
  protected readonly scrolled = signal(false);

  protected readonly links = computed<readonly SectionLink[]>(() =>
    SECTION_IDS.map(({ id, key }) => ({ id, label: this.t(key) })),
  );

  /** Empty on any route without landing sections, so nothing is marked current. */
  protected readonly activeSection = this.spy.active;

  private readonly menu = viewChild.required<ElementRef<HTMLDialogElement>>('menu');
  private readonly sentinel = viewChild.required<ElementRef<HTMLElement>>('sentinel');

  constructor() {
    effect(() => {
      const dialog = this.menu().nativeElement;
      if (this.menuOpen() && !dialog.open) {
        dialog.showModal();
      } else if (!this.menuOpen() && dialog.open) {
        dialog.close();
      }
    });

    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') {
        return;
      }
      const observer = new IntersectionObserver(([entry]) =>
        this.scrolled.set(!entry.isIntersecting),
      );
      observer.observe(this.sentinel().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected openMenu(): void {
    this.menuOpen.set(true);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected switchLocale(locale: Locale): void {
    this.localeSwitch.switchTo(locale, this.activeSection());
  }

  /** `01`, `02`… for the menu, in the locale's own digits. */
  protected index(position: number): string {
    return new Intl.NumberFormat(this.i18n.meta().tag, {
      minimumIntegerDigits: 2,
      useGrouping: false,
    }).format(position + 1);
  }
}
