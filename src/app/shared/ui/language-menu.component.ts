import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';
import type { Locale, LocaleMeta } from '../../core/i18n/locale';
import { ButtonComponent } from './button.component';
import { IconComponent } from './icon.component';

/**
 * The language picker.
 *
 * Built as an ARIA menu rather than a `<select>`: the trigger has to show a globe
 * and the current locale's own name in its own script, which a native option list
 * cannot style. That choice buys the styling and costs the keyboard behaviour a
 * `<select>` would have given for free, so all of it is implemented here —
 * Escape to close, arrows to move, Home/End to jump, focus returned to the
 * trigger on close, and a click outside to dismiss.
 *
 * `menuitemradio` + `aria-checked` is the right role pair: these are mutually
 * exclusive settings, not commands, and the checked one is announced as such.
 */
@Component({
  selector: 'app-language-menu',
  imports: [ButtonComponent, IconComponent],
  host: {
    class: 'relative',
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'close(true)',
  },
  template: `
    <button
      #trigger
      appButton="secondary"
      size="sm"
      type="button"
      (click)="toggle()"
      (keydown.arrowdown)="openWithFocus($event)"
      [attr.aria-expanded]="open()"
      [attr.aria-label]="i18n.t('lang.current', { name: current().nativeName })"
      aria-haspopup="menu"
      aria-controls="language-menu-panel"
      class="gap-1.5 px-2.5 font-medium"
    >
      <app-icon name="globe" class="size-[1.15rem]" />
      <span aria-hidden="true">{{ current().short }}</span>
      <app-icon
        name="chevron-down"
        class="size-3.5 transition-transform duration-(--duration-fast) ease-standard"
        [class.rotate-180]="open()"
      />
    </button>

    @if (open()) {
      <div
        id="language-menu-panel"
        role="menu"
        [attr.aria-label]="i18n.t('lang.choose')"
        class="absolute end-0 top-full z-50 mt-2 min-w-44 overflow-hidden rounded-md border border-border-subtle bg-surface-card p-1 shadow-lg"
      >
        @for (locale of i18n.available; track locale.code) {
          <button
            #item
            appButton="ghost"
            size="sm"
            type="button"
            role="menuitemradio"
            [attr.aria-checked]="locale.code === current().code"
            [attr.lang]="locale.code"
            [attr.dir]="locale.dir"
            (click)="select(locale.code)"
            (keydown)="onItemKeydown($event, $index)"
            class="w-full justify-start gap-2.5 px-2.5 py-2 text-start font-normal aria-checked:font-semibold aria-checked:text-text-strong"
          >
            <!--
              The tick is the only thing that distinguishes the active row, so the
              inactive rows reserve its width instead of collapsing — otherwise
              the labels would shift sideways as the selection moves.
            -->
            <span class="grid size-4 place-items-center">
              @if (locale.code === current().code) {
                <app-icon name="check" class="size-4 text-primary" />
              }
            </span>
            <span class="flex-1">{{ locale.nativeName }}</span>
            <span class="text-xs tracking-wide text-text-muted">{{ locale.short }}</span>
          </button>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageMenuComponent {
  protected readonly i18n = inject(I18nService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly triggerRef = viewChild.required<ButtonComponent, ElementRef<HTMLButtonElement>>(
    'trigger',
    {
      read: ElementRef,
    },
  );
  private readonly itemRefs = viewChildren<ButtonComponent, ElementRef<HTMLButtonElement>>('item', {
    read: ElementRef,
  });

  protected readonly open = signal(false);
  protected readonly current = computed<LocaleMeta>(() => this.i18n.meta());

  /** Set when the menu was opened from the keyboard, so focus moves into it. */
  private focusOnOpen = false;

  constructor() {
    // Focus has to move after the panel exists, and the panel only exists once
    // `open` is true — so this is an effect on the query, not on the click.
    effect(() => {
      const items = this.itemRefs();
      if (!this.open() || !this.focusOnOpen || items.length === 0) {
        return;
      }
      this.focusOnOpen = false;
      const active = this.i18n.available.findIndex((l) => l.code === this.i18n.locale());
      items[Math.max(active, 0)].nativeElement.focus();
    });
  }

  protected toggle(): void {
    this.open.update((isOpen) => !isOpen);
  }

  protected openWithFocus(event: Event): void {
    event.preventDefault();
    this.focusOnOpen = true;
    this.open.set(true);
  }

  protected select(locale: Locale): void {
    this.i18n.setLocale(locale);
    this.close(true);
  }

  /**
   * `returnFocus` is false for a click outside — the visitor has already moved
   * their attention elsewhere, and yanking focus back to the trigger would undo
   * whatever they just clicked.
   */
  protected close(returnFocus: boolean): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.focusOnOpen = false;
    if (returnFocus) {
      this.triggerRef().nativeElement.focus();
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close(false);
    }
  }

  protected onItemKeydown(event: KeyboardEvent, index: number): void {
    const items = this.itemRefs();
    const last = items.length - 1;

    // Arrow direction is physical, not logical: Down is always the next item in
    // the list, in Arabic exactly as in French.
    const next: Record<string, number | undefined> = {
      ArrowDown: index === last ? 0 : index + 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };

    const target = next[event.key];
    if (target === undefined) {
      return;
    }
    event.preventDefault();
    items[target].nativeElement.focus();
  }
}
