import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Marks a section that is scaffolded but not built yet, so an unfinished page is
 * obvious in the browser instead of looking merely empty.
 *
 * Every usage is a to-do. Grep for `app-scaffold-note` to find what is left; the
 * component should not survive to production.
 */
@Component({
  selector: 'app-scaffold-note',
  template: `
    <div
      class="rounded-md border border-dashed border-border-strong bg-surface-muted p-6 text-sm text-text-muted"
    >
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScaffoldNoteComponent {}
