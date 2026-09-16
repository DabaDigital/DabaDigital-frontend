import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';

import { I18nService } from '../../core/i18n/i18n.service';
import type { DropdownOption } from './dropdown-list.component';
import { FormFieldComponent } from './form-field.component';
import { MultiSelectComponent } from './multi-select.component';

const CATEGORIES: readonly DropdownOption[] = [
  { value: 'web', label: 'Web' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'ai', label: 'AI', disabled: true },
  { value: 'mobile', label: 'Mobile' },
];

@Component({
  selector: 'app-multi-select-test-host',
  imports: [ReactiveFormsModule, FormFieldComponent, MultiSelectComponent],
  template: `
    <app-form-field label="Project categories" fieldId="categories" [error]="error()">
      <app-multi-select
        placeholder="Choose categories"
        emptyLabel="No categories yet."
        [options]="options()"
        [formControl]="categories"
      />
    </app-form-field>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MultiSelectHost {
  readonly error = signal('');
  readonly options = signal(CATEGORIES);
  readonly categories = new FormControl<string[]>([]);
}

describe('MultiSelectComponent', () => {
  let fixture: ComponentFixture<MultiSelectHost>;
  let form: MultiSelectHost;
  let host: HTMLElement;
  let trigger: HTMLButtonElement;

  function option(label: string): HTMLButtonElement {
    const match = [...host.querySelectorAll<HTMLButtonElement>('[role="option"]')].find(
      (element) => element.textContent?.trim() === label,
    );
    if (!match) throw new Error(`Missing option in test: ${label}`);
    return match;
  }
  function press(key: string): void {
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }
  const chips = (): string[] =>
    [...host.querySelectorAll('.multi-chip')].map((chip) => chip.textContent?.trim() ?? '');
  const activeLabel = (): string | undefined =>
    host.querySelector(`#${trigger.getAttribute('aria-activedescendant')}`)?.textContent?.trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MultiSelectHost] }).compileComponents();
    TestBed.inject(I18nService).setLocale('en');
    fixture = TestBed.createComponent(MultiSelectHost);
    form = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    const element = host.querySelector<HTMLButtonElement>('#categories');
    if (!element) throw new Error('trigger not rendered');
    trigger = element;
  });

  it('keeps the list open while picking and shows the picks as chips in list order', () => {
    expect(host.querySelector('label[for="categories"]')?.textContent).toContain(
      'Project categories',
    );
    expect(trigger.getAttribute('role')).toBe('combobox');
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger.textContent).toContain('Choose categories');

    trigger.click();
    fixture.detectChanges();
    expect(host.querySelector('[role="listbox"]')?.getAttribute('aria-multiselectable')).toBe(
      'true',
    );
    option('Mobile').click();
    fixture.detectChanges();
    option('Web').click();
    fixture.detectChanges();

    expect(form.categories.value).toEqual(['web', 'mobile']);
    expect(form.categories.dirty).toBe(true);
    expect(host.querySelector('[role="listbox"]')).not.toBeNull();
    expect(option('Web').getAttribute('aria-selected')).toBe('true');
    expect(option('E-commerce').getAttribute('aria-selected')).toBe('false');
    expect(chips()).toEqual(['Web', 'Mobile']);

    option('Web').click();
    fixture.detectChanges();
    expect(form.categories.value).toEqual(['mobile']);
    expect(chips()).toEqual(['Mobile']);
  });

  it('toggles the active option from the keyboard, skipping disabled ones, until Escape', () => {
    trigger.focus();
    press('ArrowDown');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(activeLabel()).toBe('Web');

    press(' ');
    press('ArrowDown');
    press('Enter');
    expect(form.categories.value).toEqual(['web', 'ecommerce']);

    press('ArrowDown');
    expect(activeLabel()).toBe('Mobile');
    press('Enter');
    press('Enter');
    expect(form.categories.value).toEqual(['web', 'ecommerce']);

    press('Escape');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(host.querySelector('[role="listbox"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('follows the form: written values, field errors, touched and disabled', () => {
    form.categories.setValue(['mobile', 'web']);
    fixture.detectChanges();
    expect(chips()).toEqual(['Web', 'Mobile']);

    form.error.set('Choose at least one category.');
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.getAttribute('aria-describedby')).toBe('categories-error');

    trigger.dispatchEvent(new Event('blur'));
    expect(form.categories.touched).toBe(true);

    form.categories.disable();
    fixture.detectChanges();
    expect(trigger.disabled).toBe(true);
  });

  it('explains an empty list and closes on an outside click', () => {
    form.options.set([]);
    fixture.detectChanges();
    trigger.click();
    fixture.detectChanges();
    expect(host.querySelector('.dropdown-panel')?.textContent).toContain('No categories yet.');
    expect(host.querySelector('[role="listbox"]')).toBeNull();

    document.body.click();
    fixture.detectChanges();
    expect(host.querySelector('.dropdown-panel')).toBeNull();
  });
});
