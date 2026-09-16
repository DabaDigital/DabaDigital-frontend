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

export interface SelectButtonOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  /** An optional tally after the label, e.g. how many rows a filter matches. */
  readonly count?: number;
}

let nextSelectButtonsId = 0;

/**
 * A single-choice control with native radio keyboard behavior and optional form binding.
 * `pill` suits marketing filters; `tabs` is the quieter segmented look for toolbars.
 */
@Component({
  selector: 'app-select-buttons',
  host: { '[attr.data-variant]': 'variant()' },
  template: `
    <fieldset [disabled]="isDisabled()">
      <legend class="sr-only">{{ label() }}</legend>
      <div class="options">
        @for (option of options(); track option.value; let index = $index) {
          <label class="option" [for]="groupId + '-' + index">
            <input
              class="sr-only"
              type="radio"
              [id]="groupId + '-' + index"
              [name]="name()"
              [value]="option.value"
              [checked]="value() === option.value"
              [disabled]="isDisabled() || option.disabled === true"
              (change)="select(option)"
              (blur)="markTouched()"
            />
            <span class="option-face"
              >{{ option.label }}
              @if (option.count !== undefined) {
                <span class="option-count">{{ option.count }}</span>
              }
            </span>
          </label>
        }
      </div>
    </fieldset>
  `,
  styleUrl: './select-buttons.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectButtonsComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectButtonsComponent implements ControlValueAccessor {
  protected readonly groupId = `app-select-buttons-${nextSelectButtonsId++}`;

  readonly options = input.required<readonly SelectButtonOption[]>();
  readonly label = input.required<string>();
  readonly name = input(this.groupId);
  readonly variant = input<'pill' | 'tabs'>('pill');
  readonly value = model('');
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  private onChange: (value: string) => void = () => undefined;
  protected markTouched: () => void = () => undefined;

  writeValue(value: string | null | undefined): void {
    this.value.set(value ?? '');
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.markTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  protected select(option: SelectButtonOption): void {
    if (this.isDisabled() || option.disabled || this.value() === option.value) {
      return;
    }
    this.value.set(option.value);
    this.onChange(option.value);
  }
}
