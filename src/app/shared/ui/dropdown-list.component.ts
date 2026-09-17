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
  viewChildren,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import { AnchoredPanelDirective } from './anchored-panel.directive';
import { FORM_FIELD, joinIds } from './form-field.component';
import { IconComponent, type IconName } from './icon.component';
import {
  boundaryEnabledIndex,
  indexByPrefix,
  keepOptionInView,
  nextEnabledIndex,
} from './listbox-navigation';

export interface DropdownOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  /** Shown before the label, in the list and on the trigger. */
  readonly icon?: IconName;
}

let nextDropdownId = 0;

/**
 * A themed select-only combobox with mouse, touch and complete keyboard operation.
 * Inside `app-form-field` it takes the field's id, describedby, invalid and
 * required state; `inputId` and the matching inputs are for standalone use.
 */
@Component({
  selector: 'app-dropdown-list',
  imports: [AnchoredPanelDirective, IconComponent],
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
      [id]="controlId()"
      [attr.name]="name()"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="listboxId"
      [attr.aria-activedescendant]="open() && activeIndex() >= 0 ? optionId(activeIndex()) : null"
      [attr.aria-invalid]="isInvalid() ? 'true' : 'false'"
      [attr.aria-describedby]="describedByIds()"
      [attr.aria-required]="isRequired()"
      [disabled]="isDisabled()"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
      (blur)="onTriggerBlur()"
    >
      <span class="dropdown-value" [class.dropdown-placeholder]="!selectedOption()">
        @if (selectedOption()?.icon; as icon) {
          <app-icon [name]="icon" class="dropdown-option-icon" />
        }
        <span class="dropdown-text">{{ selectedOption()?.label ?? placeholder() }}</span>
      </span>
      <app-icon
        name="chevron-down"
        class="dropdown-chevron"
        [class.dropdown-chevron--open]="open()"
      />
    </button>

    @if (open()) {
      <div
        #listbox
        [appAnchoredPanel]="trigger"
        [id]="listboxId"
        role="listbox"
        class="dropdown-panel"
        [attr.aria-labelledby]="controlId()"
      >
        @for (option of options(); track option.value; let index = $index) {
          <button
            #option
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
            @if (option.icon) {
              <app-icon [name]="option.icon" class="dropdown-option-icon" />
            }
            <span class="dropdown-text">{{ option.label }}</span>
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
  private readonly field = inject(FORM_FIELD, { optional: true });
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly listbox = viewChild<ElementRef<HTMLElement>>('listbox');
  private readonly optionElements = viewChildren<ElementRef<HTMLElement>>('option');

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
  protected readonly controlId = computed(() => this.field?.controlId() ?? this.inputId());
  protected readonly describedByIds = computed(() =>
    joinIds(this.describedBy(), this.field?.describedBy()),
  );
  protected readonly isInvalid = computed(() => this.invalid() || !!this.field?.invalid());
  protected readonly isRequired = computed(() => this.required() || !!this.field?.required());
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly selectedOption = computed(
    () => this.options().find((option) => option.value === this.value()) ?? null,
  );

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    afterRenderEffect(() => {
      const list = this.listbox()?.nativeElement;
      const option = this.optionElements()[this.activeIndex()]?.nativeElement;
      if (list && option) {
        keepOptionInView(list, option);
      }
    });
  }

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
      // Cancelling the keydown also stops an enclosing modal dialog from closing.
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
        this.activeIndex.set(nextEnabledIndex(this.options(), this.activeIndex(), direction));
      }
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (!this.open()) {
        this.openList();
      }
      this.activeIndex.set(boundaryEnabledIndex(this.options(), event.key === 'Home' ? 1 : -1));
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const index = indexByPrefix(this.options(), this.activeIndex(), event.key);
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
    this.activeIndex.set(selected >= 0 ? selected : boundaryEnabledIndex(this.options(), 1));
  }

  private close(): void {
    this.open.set(false);
    this.activeIndex.set(-1);
  }
}
