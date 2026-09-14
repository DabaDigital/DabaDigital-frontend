import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { IconComponent } from './icon.component';

/**
 * The ✨ badge that marks a voice-filled field, plus its undo action.
 *
 * Every string is an input, never looked up here — components lower than a
 * page own no i18n keys of their own (see `dropdown-list.component.ts` for
 * the same convention). The badge is informative, never a lock: the field
 * next to it stays fully editable, and typing in it is what makes the badge
 * disappear (the parent drives that via `source`, not this component).
 *
 * Never color-only: the sparkle icon is decorative (`aria-hidden` by
 * default in `IconComponent`), the hint text next to it carries the meaning.
 */
@Component({
  selector: 'app-ai-badge',
  imports: [IconComponent],
  template: `
    <span
      class="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary"
    >
      <app-icon name="sparkles" class="size-3" />
      {{ hint() }}
    </span>
    <button
      type="button"
      class="inline-flex items-center gap-1 text-xs font-medium text-text-muted underline decoration-border-strong underline-offset-2 transition-colors duration-(--duration-fast) ease-standard hover:text-text-strong"
      (click)="undo.emit()"
    >
      <app-icon name="undo" class="size-3" />
      {{ undoLabel() }}
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiBadgeComponent {
  /** "Extracted from your description", already translated. */
  readonly hint = input.required<string>();
  readonly undoLabel = input.required<string>();
  readonly undo = output<void>();
}
