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
import { InputDirective } from './input.directive';

let nextSearchInputId = 0;

/** Search field with a labelled clear action; accepts [(value)] or Angular form controls. */
@Component({
  selector: 'app-search-input',
  imports: [IconComponent, InputDirective],
  template: `
    <label class="sr-only" [for]="inputId()">{{ label() }}</label>
    <div class="search-field">
      <svg
        class="search-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </svg>
      <input
        #searchElement
        appInput
        type="search"
        class="search-control"
        [size]="size()"
        [id]="inputId()"
        [attr.name]="name()"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        (input)="updateValue(searchElement.value)"
        (blur)="markTouched()"
      />
      @if (value()) {
        <button
          type="button"
          class="clear-button"
          [attr.aria-label]="clearLabel()"
          [disabled]="isDisabled()"
          (click)="clear(searchElement)"
        >
          <app-icon name="close" class="size-4" />
        </button>
      }
    </div>
  `,
  styleUrl: './search-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent implements ControlValueAccessor {
  readonly inputId = input(`app-search-input-${nextSearchInputId++}`);
  readonly name = input<string | null>(null);
  readonly label = input.required<string>();
  readonly clearLabel = input.required<string>();
  readonly placeholder = input('');
  readonly size = input<'md' | 'sm'>('md');
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

  protected updateValue(value: string): void {
    if (this.isDisabled()) {
      return;
    }
    this.value.set(value);
    this.onChange(value);
  }

  protected clear(element: HTMLInputElement): void {
    if (this.isDisabled()) {
      return;
    }
    this.updateValue('');
    element.focus();
  }
}
