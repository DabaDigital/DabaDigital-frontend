import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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

import { IconComponent } from './icon.component';

export interface DropdownOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

let nextDropdownId = 0;

/** A themed select-only combobox with mouse, touch and complete keyboard operation. */
@Component({
  selector: 'app-dropdown-list',
  imports: [IconComponent],
  host: {
    class: 'dropdown-list',
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <button
      #trigger
      type="button"
      role="combobox"
      class="dropdown-trigger"
      [id]="inputId()"
      [attr.name]="name()"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="listboxId"
      [attr.aria-activedescendant]="open() && activeIndex() >= 0 ? optionId(activeIndex()) : null"
      [attr.aria-invalid]="invalid() ? 'true' : 'false'"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-required]="required()"
      [disabled]="isDisabled()"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
      (blur)="onTriggerBlur()"
    >
      <span class="dropdown-value" [class.dropdown-placeholder]="!selectedOption()">
        {{ selectedOption()?.label ?? placeholder() }}
      </span>
      <app-icon
        name="chevron-down"
        class="dropdown-chevron"
        [class.dropdown-chevron--open]="open()"
      />
    </button>

    @if (open()) {
      <div
        [id]="listboxId"
        role="listbox"
        class="dropdown-panel"
        [attr.aria-labelledby]="inputId()"
      >
        @for (option of options(); track option.value; let index = $index) {
          <button
            type="button"
            role="option"
            class="dropdown-option"
            [id]="optionId(index)"
            [class.dropdown-option--active]="activeIndex() === index"
            [class.dropdown-option--selected]="value() === option.value"
            [attr.aria-selected]="value() === option.value"
            [attr.aria-disabled]="option.disabled === true"
            [disabled]="option.disabled === true"
            tabindex="-1"
            (pointerenter)="activate(index)"
            (click)="select(option)"
          >
            <span>{{ option.label }}</span>
            @if (value() === option.value) {
              <app-icon name="check" class="dropdown-check" />
            }
          </button>
        }
      </div>
    }
  `,
  styleUrl: './dropdown-list.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownListComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownListComponent implements ControlValueAccessor {
  private readonly generatedId = `app-dropdown-${nextDropdownId++}`;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  readonly options = input.required<readonly DropdownOption[]>();
  readonly placeholder = input('');
  readonly inputId = input(this.generatedId);
  readonly name = input<string | null>(null);
  readonly describedBy = input<string | null>(null);
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model('');

  protected readonly listboxId = `${this.generatedId}-listbox`;
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);
  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly selectedOption = computed(
    () => this.options().find((option) => option.value === this.value()) ?? null,
  );

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null | undefined): void {
    this.value.set(value ?? '');
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
    if (disabled) {
      this.close();
    }
  }

  protected toggle(): void {
    if (this.isDisabled()) {
      return;
    }
    if (this.open()) {
      this.close();
    } else {
      this.openList();
    }
  }

  protected activate(index: number): void {
    if (!this.options()[index]?.disabled) {
      this.activeIndex.set(index);
    }
  }

  protected select(option: DropdownOption): void {
    if (this.isDisabled() || option.disabled) {
      return;
    }
    this.value.set(option.value);
    this.onChange(option.value);
    this.onTouched();
    this.close();
    this.trigger().nativeElement.focus();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) {
      return;
    }

    if (event.key === 'Escape') {
      if (this.open()) {
        event.preventDefault();
        this.close();
      }
      return;
    }

    if (event.key === 'Tab') {
      this.close();
      this.onTouched();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.open()) {
        this.openList();
      } else {
        const option = this.options()[this.activeIndex()];
        if (option) {
          this.select(option);
        }
      }
      return;
    }

    const direction = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (direction !== 0) {
      event.preventDefault();
      if (!this.open()) {
        this.openList();
      } else {
        this.moveActive(direction);
      }
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (!this.open()) {
        this.openList();
      }
      this.activeIndex.set(this.enabledBoundary(event.key === 'Home' ? 1 : -1));
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const index = this.findByPrefix(event.key);
      if (index >= 0) {
        event.preventDefault();
        if (!this.open()) {
          this.openList();
        }
        this.activeIndex.set(index);
      }
    }
  }

  protected onTriggerBlur(): void {
    this.onTouched();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  protected optionId(index: number): string {
    return `${this.generatedId}-option-${index}`;
  }

  private openList(): void {
    this.open.set(true);
    const selected = this.options().findIndex(
      (option) => option.value === this.value() && !option.disabled,
    );
    this.activeIndex.set(selected >= 0 ? selected : this.enabledBoundary(1));
  }

  private close(): void {
    this.open.set(false);
    this.activeIndex.set(-1);
  }

  private moveActive(direction: 1 | -1): void {
    const options = this.options();
    if (options.length === 0) {
      return;
    }
    let index = this.activeIndex();
    options.some(() => {
      index = (index + direction + options.length) % options.length;
      if (!options[index]?.disabled) {
        this.activeIndex.set(index);
        return true;
      }
      return false;
    });
  }

  private enabledBoundary(direction: 1 | -1): number {
    const options = this.options();
    let index = direction === 1 ? 0 : options.length - 1;
    while (index >= 0 && index < options.length) {
      if (!options[index]?.disabled) {
        return index;
      }
      index += direction;
    }
    return -1;
  }

  private findByPrefix(character: string): number {
    const collator = new Intl.Collator(undefined, { sensitivity: 'base', usage: 'search' });
    const start = Math.max(this.activeIndex() + 1, 0);
    const options = this.options();
    for (const offset of options.keys()) {
      const index = (start + offset) % options.length;
      const option = options[index];
      if (!option?.disabled && collator.compare(option.label.slice(0, 1), character) === 0) {
        return index;
      }
    }
    return -1;
  }
}
