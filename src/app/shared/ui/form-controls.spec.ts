import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';

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
