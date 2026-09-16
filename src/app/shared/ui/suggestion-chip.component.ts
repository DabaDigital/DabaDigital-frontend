import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { IconComponent } from './icon.component';

/**
 * A low-confidence or manually-locked voice value: never auto-filled
 * (frontend CLAUDE.md invariant 3), offered here instead as something the
 * visitor accepts or dismisses. An empty field beats a wrong one, but a
 * plausible one is still worth surfacing rather than silently dropping.
 */
@Component({
  selector: 'app-suggestion-chip',
  imports: [IconComponent],
  template: `
    <span
      class="inline-flex flex-wrap items-center gap-2 rounded-full border border-border-glass bg-surface-glass py-1.5 ps-3 pe-2 text-sm"
    >
      <app-icon name="sparkles" class="size-3.5 text-primary" />
      <span class="text-text-strong">{{ text() }}</span>
      <button
        type="button"
        class="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary transition-colors duration-(--duration-fast) ease-standard hover:bg-primary hover:text-white"
        (click)="accept.emit()"
      >
        {{ acceptLabel() }}
      </button>
      <button
        type="button"
        class="flex size-6 items-center justify-center rounded-full text-text-muted transition-colors duration-(--duration-fast) ease-standard hover:bg-surface-card hover:text-text-strong"
        [attr.aria-label]="dismissLabel()"
        (click)="dismiss.emit()"
      >
        <app-icon name="close" class="size-3.5" />
      </button>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestionChipComponent {
  /** Already-composed, already-translated text, e.g. "Budget: 60 000 MAD?". */
  readonly text = input.required<string>();
  readonly acceptLabel = input.required<string>();
  readonly dismissLabel = input.required<string>();
  readonly accept = output<void>();
  readonly dismiss = output<void>();
}
