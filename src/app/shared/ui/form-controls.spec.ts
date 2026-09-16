import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';

import { I18nService } from '../../core/i18n/i18n.service';
import { CheckboxGroupComponent, type CheckboxOption } from './checkbox-group.component';
import { FormFieldComponent } from './form-field.component';
import { InputDirective } from './input.directive';
import { NumberInputComponent } from './number-input.component';
import { SearchInputComponent } from './search-input.component';
import { DropdownListComponent, type DropdownOption } from './dropdown-list.component';
import { SelectButtonsComponent, type SelectButtonOption } from './select-buttons.component';

@Component({
  selector: 'app-form-controls-test-host',
  imports: [
    ReactiveFormsModule,
    DropdownListComponent,
    SearchInputComponent,
    SelectButtonsComponent,
  ],
  template: `
    <app-search-input
      data-testid="search"
      label="Search projects"
      clearLabel="Clear search"
      [formControl]="search"
    />
    <app-search-input
      data-testid="blur-search"
      label="Search on blur"
      clearLabel="Clear search on blur"
      [formControl]="blurSearch"
    />
    <app-select-buttons
      data-testid="category"
      label="Project type"
      [options]="options"
      [formControl]="category"
    />
    <app-select-buttons
      data-testid="second-category"
      label="Second project type"
      [options]="options"
      [formControl]="secondCategory"
    />
    <label for="test-dropdown">Project format</label>
    <app-dropdown-list
      inputId="test-dropdown"
      placeholder="Choose a format"
      [options]="dropdownOptions"
      [formControl]="dropdown"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormControlsTestHost {
  readonly search = new FormControl('Ledger');
  readonly blurSearch = new FormControl('Ledger', { updateOn: 'blur' });
  readonly category = new FormControl('all');
  readonly secondCategory = new FormControl('all');
  readonly dropdown = new FormControl('');
  readonly options: readonly SelectButtonOption[] = [
    { value: 'all', label: 'All' },
    { value: 'web', label: 'Web' },
    { value: 'mobile', label: 'Mobile', disabled: true },
  ];
  readonly dropdownOptions: readonly DropdownOption[] = [
    { value: 'site', label: 'Brochure website' },
    { value: 'app', label: 'Web application' },
    { value: 'disabled', label: 'Unavailable', disabled: true },
  ];
}

describe('Shared form controls', () => {
  let fixture: ComponentFixture<FormControlsTestHost>;
  let form: FormControlsTestHost;
  let host: HTMLElement;

  function element<T extends Element>(selector: string): T {
    const found = host.querySelector<T>(selector);
    if (!found) {
      throw new Error(`Missing control in test: ${selector}`);
    }
    return found;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormControlsTestHost] }).compileComponents();
    fixture = TestBed.createComponent(FormControlsTestHost);
    form = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('reflects programmatic search values, resets and disabled state in the native input', () => {
    const input = element<HTMLInputElement>('[data-testid="search"] input');
    expect(input.value).toBe('Ledger');

    form.search.setValue('Atlas');
    fixture.detectChanges();
    expect(input.value).toBe('Atlas');
    expect(form.search.pristine).toBe(true);

    form.search.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect(element<HTMLButtonElement>('[data-testid="search"] button').disabled).toBe(true);

    form.search.enable();
    form.search.reset();
    fixture.detectChanges();
    expect(input.disabled).toBe(false);
    expect(input.value).toBe('');
    expect(host.querySelector('[data-testid="search"] button')).toBeNull();
  });

  it('propagates search edits and blur to the form while refusing edits when disabled', () => {
    const input = element<HTMLInputElement>('[data-testid="search"] input');
    input.value = 'Commerce';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(form.search.value).toBe('Commerce');
    expect(form.search.dirty).toBe(true);
    expect(form.search.touched).toBe(false);

    input.dispatchEvent(new Event('blur'));
    expect(form.search.touched).toBe(true);

    form.search.disable();
    fixture.detectChanges();
    input.value = 'Ignored';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(form.search.value).toBe('Commerce');
  });

  it('returns focus after clearing and respects a form configured to update on blur', () => {
    const input = element<HTMLInputElement>('[data-testid="blur-search"] input');
    input.focus();
    input.value = 'Atlas';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(form.blurSearch.value).toBe('Ledger');
    input.blur();
    expect(form.blurSearch.value).toBe('Atlas');
    fixture.detectChanges();

    element<HTMLButtonElement>('[data-testid="blur-search"] button').click();
    fixture.detectChanges();
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
    expect(form.blurSearch.value).toBe('Atlas');

    input.blur();
    expect(form.blurSearch.value).toBe('');
  });

  it('synchronizes radio selection, reset, blur and disabled options with the form', () => {
    const web = element<HTMLInputElement>('[data-testid="category"] input[value="web"]');
    const mobile = element<HTMLInputElement>('[data-testid="category"] input[value="mobile"]');
    const radios = host.querySelectorAll<HTMLInputElement>('[data-testid="category"] input');

    form.category.setValue('web');
    fixture.detectChanges();
    expect(web.checked).toBe(true);
    expect(form.category.pristine).toBe(true);

    form.category.reset();
    fixture.detectChanges();
    expect([...radios].some((radio) => radio.checked)).toBe(false);
    web.click();
    expect(form.category.value).toBe('web');
    expect(form.category.dirty).toBe(true);
    expect(form.category.touched).toBe(false);
    web.dispatchEvent(new Event('blur'));
    expect(form.category.touched).toBe(true);

    expect(mobile.disabled).toBe(true);
    mobile.click();
    expect(form.category.value).toBe('web');

    form.category.disable();
    fixture.detectChanges();
    expect([...radios].every((radio) => radio.disabled)).toBe(true);
    form.category.enable();
    fixture.detectChanges();
    expect(web.disabled).toBe(false);
    expect(mobile.disabled).toBe(true);
  });

  it('keeps multiple radio groups independent with distinct native names and IDs', () => {
    const first = element<HTMLInputElement>('[data-testid="category"] input[value="all"]');
    const second = element<HTMLInputElement>('[data-testid="second-category"] input[value="web"]');
    const inputs = [...host.querySelectorAll<HTMLInputElement>('input')];

    expect(first.name).not.toBe('');
    expect(first.name).not.toBe(second.name);
    expect(new Set(inputs.map((input) => input.id)).size).toBe(inputs.length);

    second.click();
    fixture.detectChanges();
    expect(form.secondCategory.value).toBe('web');
    expect(form.category.value).toBe('all');
    expect(first.checked).toBe(true);
    expect(second.checked).toBe(true);
  });

  it('opens the dropdown list, navigates options and synchronizes its form control', () => {
    const trigger = element<HTMLButtonElement>('#test-dropdown');
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(element<HTMLElement>('[role="listbox"]')).toBeDefined();
    expect(trigger.getAttribute('aria-activedescendant')).toContain('option-0');

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(form.dropdown.value).toBe('app');
    expect(trigger.textContent).toContain('Web application');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);

    form.dropdown.setValue('site');
    fixture.detectChanges();
    expect(trigger.textContent).toContain('Brochure website');

    form.dropdown.disable();
    fixture.detectChanges();
    expect(trigger.disabled).toBe(true);
  });
});

@Component({
  selector: 'app-field-controls-test-host',
  imports: [
    ReactiveFormsModule,
    CheckboxGroupComponent,
    DropdownListComponent,
    FormFieldComponent,
    InputDirective,
    NumberInputComponent,
  ],
  template: `
    <app-form-field
      label="Studio name"
      fieldId="studio"
      hint="As clients know it"
      required
      [error]="nameError()"
    >
      <input appInput [formControl]="name" />
    </app-form-field>
    <app-form-field label="Display order" fieldId="order">
      <app-number-input [formControl]="order" [min]="0" [max]="3" />
    </app-form-field>
    <app-form-field label="Icon" fieldId="icon" [error]="iconError()">
      <app-dropdown-list [formControl]="icon" [options]="icons" />
    </app-form-field>
    <app-checkbox-group label="Categories" [options]="categories" [formControl]="picked" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FieldControlsTestHost {
  readonly nameError = signal('');
  readonly iconError = signal('');
  readonly name = new FormControl('');
  readonly order = new FormControl<number | null>(2);
  readonly icon = new FormControl('code');
  readonly picked = new FormControl<string[]>(['web']);
  readonly icons: readonly DropdownOption[] = [
    { value: 'code', label: 'Code', icon: 'code' },
    { value: 'cloud', label: 'Cloud', icon: 'cloud' },
  ];
  readonly categories: readonly CheckboxOption[] = [
    { value: 'web', label: 'Web' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'ai', label: 'AI', disabled: true },
  ];
}

describe('Form fields and the controls inside them', () => {
  let fixture: ComponentFixture<FieldControlsTestHost>;
  let fields: FieldControlsTestHost;
  let host: HTMLElement;

  function element<T extends Element = HTMLElement>(selector: string): T {
    const found = host.querySelector<T>(selector);
    if (!found) {
      throw new Error(`Missing control in test: ${selector}`);
    }
    return found;
  }
  function checkbox(label: string): HTMLInputElement {
    const match = [...host.querySelectorAll('app-checkbox label')].find(
      (element) => element.textContent?.trim() === label,
    );
    const input = match?.querySelector('input');
    if (!input) {
      throw new Error(`Missing checkbox in test: ${label}`);
    }
    return input;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FieldControlsTestHost] }).compileComponents();
    TestBed.inject(I18nService).setLocale('en');
    fixture = TestBed.createComponent(FieldControlsTestHost);
    fields = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('gives the projected input its id, hint, required and error state', () => {
    const input = element<HTMLInputElement>('input#studio');
    expect(element('label[for="studio"]').textContent).toContain('Studio name');
    expect(element('label[for="studio"] [aria-hidden="true"]').textContent).toBe('*');
    expect(input.getAttribute('aria-describedby')).toBe('studio-hint');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(element('#studio-hint').textContent).toContain('As clients know it');

    fields.nameError.set('Please enter a name.');
    fixture.detectChanges();
    expect(input.getAttribute('aria-describedby')).toBe('studio-error');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(element('#studio-error').textContent).toContain('Please enter a name.');
    expect(host.querySelector('#studio-hint')).toBeNull();
  });

  it('wires a custom control into its field the same way, icons included', () => {
    const trigger = element<HTMLButtonElement>('#icon');
    expect(trigger.getAttribute('role')).toBe('combobox');
    expect(trigger.textContent).toContain('Code');
    expect(trigger.querySelector('app-icon')).not.toBeNull();
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);

    fields.iconError.set('Pick an icon.');
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.getAttribute('aria-describedby')).toBe('icon-error');
  });

  it('steps, clamps and clears the number input', () => {
    const input = element<HTMLInputElement>('input#order');
    const [decrease, increase] = [
      ...host.querySelectorAll<HTMLButtonElement>('app-number-input button'),
    ];
    expect(input.value).toBe('2');
    expect(decrease.getAttribute('aria-label')).toBe('Decrease');
    expect(increase.getAttribute('tabindex')).toBe('-1');

    increase.click();
    fixture.detectChanges();
    expect(fields.order.value).toBe(3);
    expect(input.value).toBe('3');
    expect(increase.disabled).toBe(true);

    input.value = '9';
    input.dispatchEvent(new Event('input'));
    expect(fields.order.value).toBe(9);
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fields.order.value).toBe(3);
    expect(input.value).toBe('3');
    expect(fields.order.touched).toBe(true);

    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(fields.order.value).toBeNull();

    fields.order.setValue(1);
    fixture.detectChanges();
    expect(input.value).toBe('1');
    decrease.click();
    fixture.detectChanges();
    expect(fields.order.value).toBe(0);
    expect(decrease.disabled).toBe(true);
  });

  it('keeps the checkbox group value as the list of checked options', () => {
    expect(element('app-checkbox-group legend').textContent).toContain('Categories');
    expect(checkbox('Web').checked).toBe(true);
    expect(checkbox('AI').disabled).toBe(true);

    checkbox('Mobile').click();
    expect(fields.picked.value).toEqual(['web', 'mobile']);
    checkbox('Web').click();
    expect(fields.picked.value).toEqual(['mobile']);
    fixture.detectChanges();
    expect(checkbox('Web').checked).toBe(false);

    fields.picked.setValue(['ai']);
    fixture.detectChanges();
    expect(checkbox('AI').checked).toBe(true);
    expect(checkbox('Mobile').checked).toBe(false);

    fields.picked.disable();
    fixture.detectChanges();
    expect(checkbox('Mobile').disabled).toBe(true);
  });
});
