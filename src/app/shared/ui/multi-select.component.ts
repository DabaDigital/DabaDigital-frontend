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

import { I18nService } from '../../core/i18n/i18n.service';
import { AnchoredPanelDirective } from './anchored-panel.directive';
import type { DropdownOption } from './dropdown-list.component';
import { FORM_FIELD, joinIds } from './form-field.component';
import { IconComponent } from './icon.component';
import {
  boundaryEnabledIndex,
  indexByPrefix,
  keepOptionInView,
  nextEnabledIndex,
} from './listbox-navigation';

let nextMultiSelectId = 0;

/**
 * A dropdown list that picks several options. The trigger shows the picks as chips,
 * and the list stays open while options are toggled — by click, Enter or Space.
 * Arrows, Home/End and type-ahead move through the list; Escape and Tab close it.
 * The value follows the list's order. Inside `app-form-field` it takes the field's
 * id, describedby, invalid and required state.
 */
@Component({
  selector: 'app-multi-select',
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
      aria-haspopup="listbox"
      class="dropdown-trigger multi-trigger"
      [class.multi-trigger--filled]="selectedOptions().length > 0"
      [id]="controlId()"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="listboxId"
      [attr.aria-activedescendant]="open() && activeIndex() >= 0 ? optionId(activeIndex()) : null"
      [attr.aria-invalid]="isInvalid() ? 'true' : 'false'"
      [attr.aria-describedby]="describedByIds()"
      [attr.aria-required]="isRequired()"
      [disabled]="isDisabled()"
      (click)="toggleList()"
      (keydown)="onTriggerKeydown($event)"
      (blur)="markTouched()"
    >
      @if (selectedOptions().length) {
        <span class="multi-chips">
          @for (option of selectedOptions(); track option.value) {
            <span class="multi-chip">{{ option.label }}</span>
          }
        </span>
      } @else {
        <span class="dropdown-text dropdown-placeholder">{{ placeholder() }}</span>
      }
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
        [attr.role]="options().length ? 'listbox' : null"
        [attr.aria-multiselectable]="options().length ? true : null"
        [attr.aria-labelledby]="controlId()"
        class="dropdown-panel"
      >
        @for (option of options(); track option.value; let index = $index) {
          <!-- mousedown is cancelled so focus stays on the trigger while toggling. -->
          <button
            #option
            type="button"
            role="option"
            class="dropdown-option multi-option"
            tabindex="-1"
            [id]="optionId(index)"
            [class.dropdown-option--active]="activeIndex() === index"
            [attr.aria-selected]="selected().has(option.value)"
            [attr.aria-disabled]="option.disabled === true"
            [disabled]="option.disabled === true"
            (mousedown)="$event.preventDefault()"
            (pointerenter)="activate(index)"
            (click)="toggle(index)"
          >
            <span class="multi-box" aria-hidden="true">
              <app-icon name="check" class="multi-check" />
            </span>
            @if (option.icon) {
              <app-icon [name]="option.icon" class="dropdown-option-icon" />
            }
            <span class="dropdown-text">{{ option.label }}</span>
          </button>
        } @empty {
          <p class="multi-empty">{{ emptyLabel() || t('controls.select.empty') }}</p>
        }
      </div>
    }
  `,
  styleUrls: ['./dropdown-list.component.scss', './multi-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelectComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiSelectComponent implements ControlValueAccessor {
  protected readonly t = inject(I18nService).t;
  private readonly generatedId = `app-multi-select-${nextMultiSelectId++}`;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly field = inject(FORM_FIELD, { optional: true });
  private readonly listbox = viewChild<ElementRef<HTMLElement>>('listbox');
  private readonly optionElements = viewChildren<ElementRef<HTMLElement>>('option');

  readonly options = input.required<readonly DropdownOption[]>();
  readonly placeholder = input('');
  /** Translated text for an empty list; a generic message when not given. */
  readonly emptyLabel = input('');
  readonly inputId = input(this.generatedId);
  readonly describedBy = input<string | null>(null);
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model<readonly string[]>([]);

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
  protected readonly selected = computed(() => new Set(this.value()));
  protected readonly selectedOptions = computed(() =>
    this.options().filter((option) => this.selected().has(option.value)),
  );

  private onChange: (value: string[]) => void = () => undefined;
  protected markTouched: () => void = () => undefined;

  constructor() {
    afterRenderEffect(() => {
      const list = this.listbox()?.nativeElement;
      const option = this.optionElements()[this.activeIndex()]?.nativeElement;
      if (list && option) {
        keepOptionInView(list, option);
      }
    });
  }

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
    if (disabled) {
      this.close();
    }
  }

  protected toggleList(): void {
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

  protected toggle(index: number): void {
    const option = this.options()[index];
    if (!option || option.disabled || this.isDisabled()) {
      return;
    }
    this.activeIndex.set(index);
    const current = this.value();
    const next = current.includes(option.value)
      ? current.filter((value) => value !== option.value)
      : this.inListOrder([...current, option.value]);
    this.value.set(next);
    this.onChange(next);
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) {
      return;
    }
    const options = this.options();
    switch (event.key) {
      case 'Escape':
        // Cancelling the keydown also stops an enclosing modal dialog from closing.
        if (this.open()) {
          event.preventDefault();
          this.close();
        }
        return;
      case 'Tab':
        this.close();
        this.markTouched();
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.open()) {
          this.toggle(this.activeIndex());
        } else {
          this.openList();
        }
        return;
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (this.open()) {
          const direction = event.key === 'ArrowDown' ? 1 : -1;
          this.activeIndex.set(nextEnabledIndex(options, this.activeIndex(), direction));
        } else {
          this.openList();
        }
        return;
      case 'Home':
      case 'End':
        event.preventDefault();
        if (!this.open()) {
          this.openList();
        }
        this.activeIndex.set(boundaryEnabledIndex(options, event.key === 'Home' ? 1 : -1));
        return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const index = indexByPrefix(options, this.activeIndex(), event.key);
      if (index >= 0) {
        event.preventDefault();
        if (!this.open()) {
          this.openList();
        }
        this.activeIndex.set(index);
      }
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !event.composedPath().includes(this.host.nativeElement)) {
      this.close();
    }
  }

  protected optionId(index: number): string {
    return `${this.generatedId}-option-${index}`;
  }

  private openList(): void {
    this.open.set(true);
    const options = this.options();
    const selected = options.findIndex(
      (option) => this.selected().has(option.value) && !option.disabled,
    );
    this.activeIndex.set(selected >= 0 ? selected : boundaryEnabledIndex(options, 1));
  }

  private close(): void {
    this.open.set(false);
    this.activeIndex.set(-1);
  }

  /** Picks in the list's order; values the list does not hold keep their place at the end. */
  private inListOrder(values: readonly string[]): string[] {
    const options = this.options();
    const known = new Set(options.map((option) => option.value));
    return [
      ...options.filter((option) => values.includes(option.value)).map((option) => option.value),
      ...values.filter((value) => !known.has(value)),
    ];
  }
}
