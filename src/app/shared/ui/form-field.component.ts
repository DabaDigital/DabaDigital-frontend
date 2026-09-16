import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  type Signal,
} from '@angular/core';

import { IconComponent } from './icon.component';

/**
 * What a control projected into `app-form-field` reads from it. The field owns the
 * id, so the label's `for`, the control's `id` and the message ids can never drift.
 */
export interface FormFieldContext {
  readonly controlId: Signal<string>;
  readonly describedBy: Signal<string | null>;
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
}

export const FORM_FIELD = new InjectionToken<FormFieldContext>('FORM_FIELD');

let nextFieldId = 0;

/**
 * Label, required marker, hint and error around one control: `appInput`,
 * `app-dropdown-list`, `app-date-picker` or `app-number-input`. The control takes
 * its `id`, `aria-describedby`, `aria-invalid` and `aria-required` from here, so
 * give a stable `fieldId` when something outside needs to find the control.
 *
 * The asterisk is `aria-hidden`; `aria-required` on the control says it instead.
 * An `error` replaces the hint rather than stacking under it. Content marked
 * `appFieldAside` sits beside the label — the voice assistant's ✨ badge, for one.
 */
@Component({
  selector: 'app-form-field',
  imports: [IconComponent],
  providers: [{ provide: FORM_FIELD, useExisting: forwardRef(() => FormFieldComponent) }],
  template: `
    <div class="form-field__header">
      <label class="form-field__label" [for]="controlId()">
        {{ label() }}
        @if (required()) {
          <span class="form-field__required" aria-hidden="true">*</span>
        }
        @if (optionalLabel()) {
          <span class="form-field__optional">({{ optionalLabel() }})</span>
        }
      </label>
      <ng-content select="[appFieldAside]" />
    </div>
    <ng-content />
    @if (error()) {
      <p class="form-field__message form-field__message--error" [id]="errorId()">
        <app-icon name="alert" class="form-field__icon" />
        <span>{{ error() }}</span>
      </p>
    } @else if (hint()) {
      <p class="form-field__message" [id]="hintId()">{{ hint() }}</p>
    }
  `,
  styles: `
    @layer components {
      :host {
        display: grid;
        align-content: start;
        gap: 0.375rem;
        min-inline-size: 0;
      }

      .form-field__header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.25rem 0.75rem;
      }

      .form-field__label {
        color: var(--text-strong);
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1.4;
      }

      .form-field__required {
        margin-inline-start: 0.125rem;
        color: var(--danger);
      }

      .form-field__optional {
        margin-inline-start: 0.25rem;
        color: var(--text-muted);
        font-size: 0.75rem;
        font-weight: 400;
      }

      .form-field__message {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        margin: 0;
        color: var(--text-muted);
        font-size: 0.875rem;
        line-height: 1.5;
      }

      .form-field__message--error {
        color: var(--danger);
      }

      .form-field__icon {
        inline-size: 0.875rem;
        block-size: 0.875rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent implements FormFieldContext {
  readonly label = input.required<string>();
  readonly fieldId = input(`app-field-${nextFieldId++}`);
  readonly hint = input('');
  /** A translated message; empty or null when the field is valid. */
  readonly error = input<string | null>('');
  readonly required = input(false, { transform: booleanAttribute });
  /** Translated "optional" text, shown in parentheses after the label. */
  readonly optionalLabel = input('');

  readonly controlId = computed(() => this.fieldId());
  protected readonly hintId = computed(() => `${this.fieldId()}-hint`);
  protected readonly errorId = computed(() => `${this.fieldId()}-error`);
  readonly invalid = computed(() => !!this.error());
  readonly describedBy = computed(() =>
    this.error() ? this.errorId() : this.hint() ? this.hintId() : null,
  );
}

/** Joins describedby id lists, dropping the empty ones. */
export function joinIds(...ids: (string | null | undefined)[]): string | null {
  return ids.filter(Boolean).join(' ') || null;
}
