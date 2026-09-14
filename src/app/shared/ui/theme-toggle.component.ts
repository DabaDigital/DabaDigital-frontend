import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';
import { ThemeService } from '../../core/theme/theme.service';
import { ButtonComponent } from './button.component';
import { IconComponent } from './icon.component';

/**
 * The light/dark switch.
 *
 * Both glyphs are rendered and cross-faded rather than swapped by `@if`: the
 * button then has a stable size whatever the theme, so the header never reflows
 * on a toggle, and the rotation reads as one control changing state instead of
 * two icons replacing each other. Only `opacity` and `transform` animate, so the
 * whole thing stays on the compositor.
 *
 * The accessible name states the *action* ("Switch to dark theme"), not the
 * current state, because that is what a screen-reader user is deciding about.
 * There is no `aria-pressed`: this is not a two-state toggle button in the ARIA
 * sense — it is a button whose label changes.
 */
@Component({
  selector: 'app-theme-toggle',
  imports: [ButtonComponent, IconComponent],
  template: `
    <button
      appButton="secondary"
      size="icon"
      type="button"
      (click)="theme.toggle()"
      [class.is-dark]="isDark()"
      [attr.aria-label]="label()"
      [attr.title]="label()"
    >
      <span class="grid place-items-center">
        <app-icon name="sun" class="glyph glyph--sun size-[1.15rem]" />
        <app-icon name="moon" class="glyph glyph--moon size-[1.15rem]" />
      </span>
    </button>
  `,
  styles: `
    /* Both glyphs occupy the same grid cell, so the button sizes to one icon. */
    .glyph {
      grid-area: 1 / 1;
      transition:
        opacity var(--duration-slow) var(--ease-standard),
        transform var(--duration-slow) var(--ease-standard);
    }

    .glyph--sun,
    .is-dark .glyph--moon {
      opacity: 0;
      transform: scale(0.4) rotate(-90deg);
    }

    .glyph--moon,
    .is-dark .glyph--sun {
      opacity: 1;
      transform: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);
  private readonly i18n = inject(I18nService);

  protected readonly isDark = this.theme.isDark;

  protected readonly label = computed(() =>
    this.isDark() ? this.i18n.t('theme.switchToLight') : this.i18n.t('theme.switchToDark'),
  );
}
