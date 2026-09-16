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

import { CheckboxComponent } from './checkbox.component';

export interface CheckboxOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

/**
 * A labelled set of checkboxes whose value is the list of checked option values,
 * in the order they were checked. Use `[(value)]` or a `string[]` form control.
 */
@Component({
  selector: 'app-checkbox-group',
  imports: [CheckboxComponent],
  template: `
    <fieldset class="checkbox-group" [disabled]="isDisabled()">
      <legend class="checkbox-group__legend">{{ label() }}</legend>
      <div class="checkbox-group__options">
        @for (option of options(); track option.value) {
          <app-checkbox
            [checked]="value().includes(option.value)"
            [disabled]="isDisabled() || option.disabled === true"
            (checkedChange)="toggle(option.value, $event)"
            (focusout)="markTouched()"
            >{{ option.label }}</app-checkbox
          >
        }
      </div>
    </fieldset>
  `,
  styles: `
    @layer components {
      :host {
        display: block;
        min-inline-size: 0;
      }

      .checkbox-group {
        min-inline-size: 0;
        margin: 0;
        padding: 0;
        border: 0;
      }

      .checkbox-group__legend {
        margin-block-end: 0.25rem;
        padding: 0;
        color: var(--text-strong);
        font-size: 0.875rem;
        font-weight: 500;
      }

      .checkbox-group__options {
        display: flex;
        flex-wrap: wrap;
        column-gap: 1.25rem;
      }
    }
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxGroupComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxGroupComponent implements ControlValueAccessor {
  readonly options = input.required<readonly CheckboxOption[]>();
  readonly label = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model<readonly string[]>([]);

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  private onChange: (value: string[]) => void = () => undefined;
  protected markTouched: () => void = () => undefined;

  writeValue(value: readonly string[] | null | undefined): void {
    this.value.set(value ?? []);
  }

  registerOnChange(onChange: (value: string[]) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.markTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  protected toggle(optionValue: string, checked: boolean): void {
    const current = this.value();
    const next = checked
      ? [...current.filter((value) => value !== optionValue), optionValue]
      : current.filter((value) => value !== optionValue);
    this.value.set(next);
    this.onChange(next);
  }
}
