import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Renderer2,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';
export type ButtonSize = 'sm' | 'md' | 'icon';

/**
 * A shared button appearance on native controls, preserving forms and RouterLink.
 * Set `type="submit"` explicitly for form submission; icon buttons need a label.
 * Loading keeps the projected label in the accessibility tree and reserves its
 * space. Disabled/loading links block activation before RouterLink receives it.
 */
@Component({
  // Native hosts preserve browser semantics, form submission and link navigation.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[appButton], a[appButton]',
  host: {
    class: 'app-button',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.type]': 'isButton ? type() : null',
    '[attr.disabled]': 'isButton && blocked() ? "" : null',
    '[attr.aria-disabled]': 'blocked() ? true : null',
    '[attr.aria-busy]': 'loading() ? true : null',
    '[attr.tabindex]': '!isButton && blocked() ? -1 : tabIndex()',
  },
  template: `
    <span class="app-button__content" [class.app-button__content--loading]="loading()">
      <ng-content />
    </span>
    @if (loading()) {
      <span class="app-button__loader" aria-hidden="true"></span>
    }
  `,
  styles: `
    @layer components {
      :host {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-block-size: 3rem;
        gap: 0.5rem;
        padding-block: 0.5rem;
        padding-inline: 1.5rem;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
        font-family: var(--font-sans);
        font-size: 1rem;
        font-weight: 600;
        line-height: 1.5;
        text-decoration: none;
        cursor: pointer;
        vertical-align: middle;
        transition:
          background-color var(--duration-fast) var(--ease-standard),
          border-color var(--duration-fast) var(--ease-standard),
          color var(--duration-fast) var(--ease-standard),
          box-shadow var(--duration-fast) var(--ease-standard),
          transform var(--duration-fast) var(--ease-standard);
      }

      :host([data-variant='primary']) {
        background-color: var(--primary);
        color: var(--primary-contrast);
      }

      :host([data-variant='primary']:hover:not([aria-disabled='true'])) {
        background-color: var(--primary-hover);
      }

      :host([data-variant='secondary']) {
        border-color: var(--border-subtle);
        background-color: var(--surface-card);
        color: var(--text-body);
      }

      :host([data-variant='secondary']:hover:not([aria-disabled='true'])) {
        border-color: var(--border-strong);
        background-color: var(--surface-muted);
        color: var(--text-strong);
      }

      :host([data-variant='ghost']) {
        background-color: transparent;
        color: var(--text-body);
      }

      :host([data-variant='ghost']:hover:not([aria-disabled='true'])) {
        background-color: var(--surface-muted);
        color: var(--text-strong);
      }

      :host([data-variant='danger']) {
        background-color: var(--danger);
        color: var(--primary-contrast);
      }

      :host([data-variant='danger']:hover:not([aria-disabled='true'])) {
        background-color: color-mix(in srgb, var(--danger) 85%, var(--text-strong));
      }

      /* Quiet at rest, so a column of row actions does not shout; red on intent. */
      :host([data-variant='danger-ghost']) {
        background-color: transparent;
        color: var(--text-body);
      }

      :host([data-variant='danger-ghost']:hover:not([aria-disabled='true'])) {
        background-color: var(--danger-soft);
        color: var(--danger);
      }

      :host([data-size='sm']) {
        min-block-size: 2.5rem;
        padding-inline: 1rem;
        font-size: 0.875rem;
      }

      :host([data-size='icon']) {
        inline-size: 2.5rem;
        min-block-size: 2.5rem;
        block-size: 2.5rem;
        flex-shrink: 0;
        padding: 0;
      }

      :host(:focus-visible) {
        outline: 2px solid var(--focus-ring);
        outline-offset: 2px;
      }

      :host(:active:not([aria-disabled='true'])) {
        transform: scale(0.98);
      }

      :host([aria-disabled='true']) {
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none;
      }

      :host([aria-busy='true']) {
        opacity: 1;
        cursor: progress;
      }

      .app-button__content {
        display: inline-flex;
        flex: 1;
        align-items: center;
        justify-content: inherit;
        gap: inherit;
        min-inline-size: 0;
      }

      .app-button__content--loading {
        opacity: 0;
      }

      .app-button__loader {
        position: absolute;
        inset: 0;
        margin: auto;
        inline-size: 1.25rem;
        block-size: 1.25rem;
        border: 2px solid currentColor;
        border-inline-end-color: transparent;
        border-radius: var(--radius-pill);
        animation: app-button-spin 750ms linear infinite;
      }

      @keyframes app-button-spin {
        to {
          transform: rotate(1turn);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        :host {
          transition: none;
        }

        .app-button__loader {
          animation: none;
        }

        :host(:active) {
          transform: none;
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant, ButtonVariant | ''>('primary', {
    alias: 'appButton',
    transform: (value) => value || 'primary',
  });
  readonly size = input<ButtonSize>('md');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly tabIndex = input<number | null>(null);

  private readonly element = inject<ElementRef<HTMLButtonElement | HTMLAnchorElement>>(ElementRef);
  protected readonly isButton = this.element.nativeElement.tagName.toLowerCase() === 'button';
  protected readonly blocked = computed(() => this.disabled() || this.loading());

  constructor() {
    const renderer = inject(Renderer2);
    const destroyRef = inject(DestroyRef);

    // Capture runs before the host's click handlers, including RouterLink. Keep
    // the original href intact so an enabled link retains its native behaviour.
    for (const eventName of ['click', 'auxclick', 'contextmenu']) {
      const unlisten = renderer.listen(
        this.element.nativeElement,
        eventName,
        (event: Event) => {
          if (this.blocked()) {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
        },
        { capture: true },
      );
      destroyRef.onDestroy(unlisten);
    }
  }
}
