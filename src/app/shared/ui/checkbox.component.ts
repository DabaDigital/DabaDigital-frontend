import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import { IconComponent } from './icon.component';

let nextCheckboxId = 0;

/**
 * A themed checkbox. The native input stays in place — transparent, over the
 * drawn box — so clicks, keyboard, labels and form bindings behave natively.
 * Project the label text; use `[(checked)]` or a form control.
 */
@Component({
  selector: 'app-checkbox',
  imports: [IconComponent],
  template: `
    <label class="checkbox" [class.checkbox--disabled]="isDisabled()">
      <span class="checkbox-control">
        <input
          type="checkbox"
          class="checkbox-input"
          [id]="inputId()"
          [attr.name]="name()"
          [attr.aria-describedby]="describedBy()"
          [checked]="checked()"
          [disabled]="isDisabled()"
          (change)="toggle($event)"
          (blur)="markTouched()"
        />
        <span class="checkbox-box" aria-hidden="true">
          <app-icon name="check" class="checkbox-check" />
        </span>
      </span>
      <span class="checkbox-label"><ng-content /></span>
    </label>
  `,
  styles: `
    @layer components {
      :host {
        display: inline-block;
        min-inline-size: 0;
      }

      .checkbox {
        display: inline-flex;
        align-items: center;
        gap: 0.625rem;
        min-block-size: 2.5rem;
        color: var(--text-body);
        font-size: 0.875rem;
        cursor: pointer;
      }

      .checkbox--disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .checkbox-control {
        position: relative;
        display: inline-grid;
        flex: none;
        inline-size: 1.25rem;
        block-size: 1.25rem;
      }

      .checkbox-input {
        position: absolute;
        inset: 0;
        inline-size: 100%;
        block-size: 100%;
        margin: 0;
        opacity: 0;
        cursor: inherit;
      }

      .checkbox-box {
        display: grid;
        place-items: center;
        border: 1px solid var(--text-muted);
        border-radius: var(--radius-xs);
        background-color: var(--surface-card);
        color: var(--primary-contrast);
        pointer-events: none;
        transition:
          background-color var(--duration-fast) var(--ease-standard),
          border-color var(--duration-fast) var(--ease-standard);
      }

      .checkbox-check {
        inline-size: 0.875rem;
        block-size: 0.875rem;
        opacity: 0;
        transform: scale(0.6);
        transition:
          opacity var(--duration-fast) var(--ease-standard),
          transform var(--duration-fast) var(--ease-standard);
      }

      .checkbox:hover .checkbox-input:not(:disabled):not(:checked) + .checkbox-box {
        border-color: var(--text-strong);
      }

      .checkbox-input:checked + .checkbox-box {
        border-color: var(--primary);
        background-color: var(--primary);
      }

      .checkbox-input:checked + .checkbox-box .checkbox-check {
        opacity: 1;
        transform: none;
      }

      .checkbox-input:focus-visible + .checkbox-box {
        outline: 2px solid var(--focus-ring);
        outline-offset: 2px;
      }
    }
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxComponent implements ControlValueAccessor {
  readonly inputId = input(`app-checkbox-${nextCheckboxId++}`);
  readonly name = input<string | null>(null);
  readonly describedBy = input<string | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly checked = model(false);

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  private onChange: (checked: boolean) => void = () => undefined;
  protected markTouched: () => void = () => undefined;

  writeValue(checked: boolean | null | undefined): void {
    this.checked.set(checked === true);
  }

  registerOnChange(onChange: (checked: boolean) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.markTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  protected toggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.checked.set(checked);
    this.onChange(checked);
  }
}
