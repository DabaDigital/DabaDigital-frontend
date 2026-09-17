import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';
import { ButtonComponent } from './button.component';
import { IconComponent, type IconName } from './icon.component';

let nextDialogId = 0;

/**
 * A modal dialog that is open for as long as it is rendered: put it behind an
 * `@if` and clear the condition on `(dismissed)`. Built on native `<dialog>` with
 * `showModal()`, so focus containment, the inert page and Escape come from the
 * browser. On removal focus returns to whatever opened it.
 *
 * The body is projected and scrolls; elements marked `appDialogActions` land in
 * the footer. A form in the body submits from a footer button with `form="id"`.
 * Set `[dismissible]="false"` while work is in flight — Escape and the close
 * button then do nothing. `alert` switches the role to `alertdialog`, for
 * destructive confirmations.
 */
@Component({
  selector: 'app-dialog',
  imports: [ButtonComponent, IconComponent],
  template: `
    <dialog
      #dialog
      class="dialog"
      [attr.data-size]="size()"
      [attr.role]="alert() ? 'alertdialog' : null"
      [attr.aria-labelledby]="titleId"
      [attr.aria-describedby]="description() ? descriptionId : null"
      (cancel)="onCancel($event)"
    >
      <header class="dialog__header">
        <div class="dialog__heading">
          @if (icon(); as icon) {
            <span class="dialog__icon" [attr.data-tone]="tone()"
              ><app-icon [name]="icon" class="dialog__icon-glyph"
            /></span>
          }
          @if (eyebrow()) {
            <p class="dialog__eyebrow">{{ eyebrow() }}</p>
          }
          <h2 class="dialog__title" [id]="titleId">{{ heading() }}</h2>
          @if (description()) {
            <p class="dialog__description" [id]="descriptionId">{{ description() }}</p>
          }
        </div>
        <button
          appButton="ghost"
          size="icon"
          type="button"
          [disabled]="!dismissible()"
          [attr.aria-label]="t('controls.close')"
          (click)="dismiss()"
        >
          <app-icon name="close" class="dialog__close-glyph" />
        </button>
      </header>
      <div class="dialog__body"><ng-content /></div>
      <footer class="dialog__footer"><ng-content select="[appDialogActions]" /></footer>
    </dialog>
  `,
  styles: `
    @layer components {
      :host {
        display: contents;
      }

      .dialog {
        inline-size: min(42rem, calc(100vw - 2rem));
        max-block-size: calc(100dvh - 3rem);
        margin: auto;
        padding: 0;
        overflow: hidden;
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-xl);
        background-color: var(--surface-card);
        color: var(--text-body);
        box-shadow: var(--shadow-lg);
      }

      .dialog[open] {
        display: flex;
        flex-direction: column;
      }

      .dialog[data-size='sm'] {
        inline-size: min(28rem, calc(100vw - 2rem));
      }

      .dialog::backdrop {
        background: color-mix(in srgb, var(--surface-inverse) 45%, transparent);
        backdrop-filter: blur(4px);
      }

      .dialog__header {
        display: flex;
        flex-shrink: 0;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.5rem;
        border-block-end: 1px solid var(--border-subtle);
      }

      .dialog__heading {
        min-inline-size: 0;
      }

      .dialog__icon {
        display: grid;
        inline-size: 2.75rem;
        block-size: 2.75rem;
        margin-block-end: 1rem;
        place-items: center;
        border-radius: var(--radius-md);
        background-color: var(--primary-soft);
        color: var(--primary);
      }

      .dialog__icon[data-tone='danger'] {
        background-color: var(--danger-soft);
        color: var(--danger);
      }

      .dialog__icon-glyph {
        inline-size: 1.25rem;
        block-size: 1.25rem;
      }

      .dialog__eyebrow {
        margin: 0 0 0.25rem;
        color: var(--primary);
        font-size: 0.75rem;
        font-weight: 500;
      }

      .dialog__title {
        font-size: 1.375rem;
        font-weight: 600;
      }

      .dialog__description {
        margin: 0.5rem 0 0;
        color: var(--text-muted);
        font-size: 0.875rem;
      }

      .dialog__close-glyph {
        inline-size: 1.25rem;
        block-size: 1.25rem;
      }

      /* The only scroll container: the dialog itself clips, so header and footer stay put
         and there is one scrollbar, never two. */
      .dialog__body {
        flex: 1 1 auto;
        min-block-size: 0;
        padding: 1.5rem;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-color: var(--border-strong) transparent;
        scrollbar-width: thin;
      }

      .dialog__footer {
        display: flex;
        flex-shrink: 0;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        border-block-start: 1px solid var(--border-subtle);
      }

      .dialog__footer:empty {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent {
  protected readonly t = inject(I18nService).t;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly heading = input.required<string>();
  readonly eyebrow = input('');
  readonly description = input('');
  readonly icon = input<IconName | null>(null);
  readonly tone = input<'neutral' | 'danger'>('neutral');
  readonly size = input<'sm' | 'md'>('md');
  readonly alert = input(false, { transform: booleanAttribute });
  readonly dismissible = input(true);
  readonly dismissed = output<void>();

  private readonly id = `app-dialog-${nextDialogId++}`;
  protected readonly titleId = `${this.id}-title`;
  protected readonly descriptionId = `${this.id}-description`;

  constructor() {
    const opener = inject(DOCUMENT).activeElement;
    afterNextRender(() => this.dialog().nativeElement.showModal());
    // The element may already be detached here, which skips the browser's own
    // focus restore — so it is done by hand.
    inject(DestroyRef).onDestroy(() => {
      const dialog = this.dialog().nativeElement;
      if (dialog.open) {
        dialog.close();
      }
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus();
      }
    });
  }

  protected onCancel(event: Event): void {
    // Never let the browser close it: the parent's `@if` owns the open state.
    event.preventDefault();
    this.dismiss();
  }

  protected dismiss(): void {
    if (this.dismissible()) {
      this.dismissed.emit();
    }
  }
}
