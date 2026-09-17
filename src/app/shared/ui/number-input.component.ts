import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import { I18nService } from '../../core/i18n/i18n.service';
import { FORM_FIELD, joinIds } from './form-field.component';
import { IconComponent } from './icon.component';

let nextNumberInputId = 0;

/**
 * A whole-number stepper. The field is a native `type="number"` input, so arrow
 * keys, mobile keypads and the `spinbutton` role come from the browser; the −/+
 * buttons are pointer shortcuts for the same steps and stay out of the tab order.
 * Values are clamped to `min`/`max` on step and on blur. An empty field is `null`.
 */
@Component({
  selector: 'app-number-input',
  imports: [IconComponent],
  template: `
    <div class="number-field">
      <button
        type="button"
        class="number-step number-step--decrease"
        tabindex="-1"
        [attr.aria-label]="t('controls.number.decrease')"
        [disabled]="isDisabled() || atMin()"
        (click)="stepBy(-1)"
      >
        <app-icon name="minus" class="number-step-icon" />
      </button>
      <input
        #field
        type="number"
        inputmode="numeric"
        class="field-input number-control"
        [id]="controlId()"
        [attr.name]="name()"
        [attr.min]="min()"
        [attr.max]="max()"
        [attr.step]="step()"
        [attr.placeholder]="placeholder() || null"
        [attr.aria-describedby]="describedByIds()"
        [attr.aria-invalid]="isInvalid() ? 'true' : 'false'"
        [attr.aria-required]="isRequired() ? 'true' : null"
        [disabled]="isDisabled()"
        (input)="onInput(field)"
        (blur)="onBlur()"
      />
      <button
        type="button"
        class="number-step number-step--increase"
        tabindex="-1"
        [attr.aria-label]="t('controls.number.increase')"
        [disabled]="isDisabled() || atMax()"
        (click)="stepBy(1)"
      >
        <app-icon name="plus" class="number-step-icon" />
      </button>
    </div>
  `,
  styles: `
    @layer components {
      :host {
        display: block;
        min-inline-size: 0;
      }

      .number-field {
        position: relative;
      }

      .number-control {
        padding-inline: 3rem;
        font-variant-numeric: tabular-nums;
        text-align: center;
      }

      .number-step {
        position: absolute;
        inset-block: 0.25rem;
        display: grid;
        inline-size: 2.5rem;
        place-items: center;
        border: 0;
        border-radius: var(--radius-xs);
        background-color: transparent;
        color: var(--text-muted);
        cursor: pointer;
        transition:
          background-color var(--duration-fast) var(--ease-standard),
          color var(--duration-fast) var(--ease-standard);
      }

      .number-step--decrease {
        inset-inline-start: 0.25rem;
      }

      .number-step--increase {
        inset-inline-end: 0.25rem;
      }

      .number-step:hover:not(:disabled) {
        background-color: var(--surface-muted);
        color: var(--text-strong);
      }

      .number-step:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .number-step-icon {
        inline-size: 1rem;
        block-size: 1rem;
      }
    }
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberInputComponent implements ControlValueAccessor {
  protected readonly t = inject(I18nService).t;
  private readonly field = inject(FORM_FIELD, { optional: true });
  private readonly element = viewChild<ElementRef<HTMLInputElement>>('field');

  readonly inputId = input(`app-number-input-${nextNumberInputId++}`);
  readonly name = input<string | null>(null);
  readonly placeholder = input('');
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly step = input(1);
  readonly describedBy = input<string | null>(null);
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model<number | null>(null);

  private readonly formDisabled = signal(false);
  protected readonly controlId = computed(() => this.field?.controlId() ?? this.inputId());
  protected readonly describedByIds = computed(() =>
    joinIds(this.describedBy(), this.field?.describedBy()),
  );
  protected readonly isInvalid = computed(() => this.invalid() || !!this.field?.invalid());
  protected readonly isRequired = computed(() => this.required() || !!this.field?.required());
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly atMin = computed(() => {
    const value = this.value();
    const min = this.min();
    return value !== null && min !== null && value <= min;
  });
  protected readonly atMax = computed(() => {
    const value = this.value();
    const max = this.max();
    return value !== null && max !== null && value >= max;
  });

  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    afterRenderEffect(() => this.syncView(this.value()));
  }

  writeValue(value: number | null | undefined): void {
    const next = typeof value === 'number' && Number.isFinite(value) ? value : null;
    this.value.set(next);
    // A form write can land outside a render pass; show it now, not on the next one.
    this.syncView(next);
  }

  registerOnChange(onChange: (value: number | null) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  protected onInput(element: HTMLInputElement): void {
    this.commit(parse(element.value));
  }

  protected onBlur(): void {
    const value = this.value();
    if (value !== null && this.clamp(value) !== value) {
      this.commit(this.clamp(value));
    }
    this.onTouched();
  }

  protected stepBy(direction: 1 | -1): void {
    if (this.isDisabled()) {
      return;
    }
    const current = this.value() ?? this.min() ?? 0;
    this.commit(this.clamp(current + direction * this.step()));
  }

  private commit(value: number | null): void {
    if (value === this.value()) {
      return;
    }
    this.value.set(value);
    this.onChange(value);
  }

  /**
   * The DOM text is only rewritten when it no longer means the current value, so a
   * half-typed "-" or "05" is never yanked out from under the cursor.
   */
  private syncView(value: number | null): void {
    const element = this.element()?.nativeElement;
    if (element && parse(element.value) !== value) {
      element.value = value === null ? '' : String(value);
    }
  }

  private clamp(value: number): number {
    const min = this.min();
    const max = this.max();
    return Math.min(Math.max(value, min ?? -Infinity), max ?? Infinity);
  }
}

/** A number input's value is sanitized to '' when it is not a valid number. */
function parse(text: string): number | null {
  const value = text.trim() === '' ? NaN : Number(text);
  return Number.isFinite(value) ? value : null;
}
