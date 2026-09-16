import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';

import { I18nService } from '../../core/i18n/i18n.service';
import {
  DatePickerComponent,
  formatCalendarValue,
  parseCalendarValue,
} from './date-picker.component';
import { FormFieldComponent } from './form-field.component';

@Component({
  selector: 'app-date-picker-test-host',
  imports: [ReactiveFormsModule, DatePickerComponent, FormFieldComponent],
  template: `
    <app-form-field label="Delivery date" fieldId="delivery">
      <app-date-picker
        [formControl]="delivery"
        min="2026-09-10"
        max="2026-10-20"
        [firstDayOfWeek]="1"
      />
    </app-form-field>
    <app-form-field label="Project year" fieldId="year">
      <app-date-picker [formControl]="year" precision="year" min="2020" max="2027" />
    </app-form-field>
    <app-form-field label="Kick-off" fieldId="kickoff">
      <app-date-picker [formControl]="kickoff" />
    </app-form-field>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DatePickerHost {
  readonly delivery = new FormControl('2026-09-15');
  readonly year = new FormControl('2024');
  readonly kickoff = new FormControl('2025-03-10');
}

describe('DatePickerComponent', () => {
  let fixture: ComponentFixture<DatePickerHost>;
  let form: DatePickerHost;
  let host: HTMLElement;

  function find<T extends Element = HTMLElement>(selector: string): T {
    const found = host.querySelector<T>(selector);
    if (!found) throw new Error(`Missing element in test: ${selector}`);
    return found;
  }
  const panel = (): HTMLElement => find('[role="dialog"]');
  const cell = (date: string): HTMLButtonElement =>
    find<HTMLButtonElement>(`[role="dialog"] [data-date="${date}"]`);
  const active = (): string | null =>
    find('[role="dialog"] [data-active]').getAttribute('data-date');
  function open(id: string): void {
    find<HTMLButtonElement>(`#${id}`).click();
    fixture.detectChanges();
  }
  function press(key: string, init: KeyboardEventInit = {}): void {
    find('[role="dialog"] [data-active]').dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, ...init }),
    );
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DatePickerHost] }).compileComponents();
    TestBed.inject(I18nService).setLocale('en');
    fixture = TestBed.createComponent(DatePickerHost);
    form = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('shows the value in a combobox labelled by its field', () => {
    const trigger = find<HTMLButtonElement>('#delivery');
    expect(find('label[for="delivery"]').textContent).toContain('Delivery date');
    expect(trigger.getAttribute('role')).toBe('combobox');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.textContent).toContain('Sep 15, 2026');

    form.delivery.setValue('2026-10-01');
    fixture.detectChanges();
    expect(trigger.textContent).toContain('Oct 1, 2026');
  });

  it('opens on the value, moves with the keyboard, clamps to the range and commits a day', () => {
    open('delivery');
    expect(find('#delivery').getAttribute('aria-expanded')).toBe('true');
    expect(panel().getAttribute('aria-label')).toBe('Choose a date');
    expect(active()).toBe('2026-09-15');
    expect(cell('2026-09-15').closest('td')?.getAttribute('aria-selected')).toBe('true');
    // Week rows start on Monday, the configured first day.
    expect(find('[role="dialog"] th').getAttribute('abbr')).toBe('Monday');

    press('ArrowRight');
    expect(active()).toBe('2026-09-16');
    press('ArrowDown');
    expect(active()).toBe('2026-09-23');
    press('Home');
    expect(active()).toBe('2026-09-21');
    press('PageDown');
    expect(active()).toBe('2026-10-20');
    expect(form.delivery.value).toBe('2026-09-15');

    cell('2026-10-20').click();
    fixture.detectChanges();
    expect(form.delivery.value).toBe('2026-10-20');
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(find('#delivery'));
  });

  it('picks the active day with Enter even when keys outpace rendering', () => {
    open('delivery');
    // Every key goes to the cell focused at the start, as when typing faster than a frame.
    const first = find('[role="dialog"] [data-active]');
    for (const key of ['ArrowRight', 'ArrowRight', 'Enter']) {
      first.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    }
    fixture.detectChanges();
    expect(form.delivery.value).toBe('2026-09-17');
    expect(host.querySelector('[role="dialog"]')).toBeNull();
  });

  it('disables days outside min and max and stops paging past them', () => {
    open('delivery');
    expect(cell('2026-09-09').disabled).toBe(true);
    expect(cell('2026-09-10').disabled).toBe(false);
    const [previous, next] = [
      find<HTMLButtonElement>('[aria-label="Previous month"]'),
      find<HTMLButtonElement>('[aria-label="Next month"]'),
    ];
    expect(previous.disabled).toBe(true);

    next.click();
    fixture.detectChanges();
    expect(panel().textContent).toContain('October 2026');
    expect(cell('2026-10-21').disabled).toBe(true);
    expect(find<HTMLButtonElement>('[aria-label="Next month"]').disabled).toBe(true);
  });

  it('narrows from years to months to days', () => {
    open('kickoff');
    find<HTMLButtonElement>('[aria-label="March 2025 — choose another year"]').click();
    fixture.detectChanges();
    expect(panel().textContent).toContain('2016 – 2027');

    cell('2027').click();
    fixture.detectChanges();
    expect(active()).toBe('2027-03');
    cell('2027-02').click();
    fixture.detectChanges();
    expect(panel().textContent).toContain('February 2027');
    expect(form.kickoff.value).toBe('2025-03-10');

    cell('2027-02-10').click();
    fixture.detectChanges();
    expect(form.kickoff.value).toBe('2027-02-10');
  });

  it('picks a year straight from the year grid at year precision', () => {
    open('year');
    expect(panel().getAttribute('aria-label')).toBe('Choose a year');
    expect(cell('2019').disabled).toBe(true);
    expect(active()).toBe('2024');

    press('ArrowDown');
    expect(active()).toBe('2027');
    cell('2026').click();
    fixture.detectChanges();
    expect(form.year.value).toBe('2026');
    expect(find('#year').textContent).toContain('2026');
  });

  it('follows the reading direction for the arrow keys in Arabic', () => {
    TestBed.inject(I18nService).setLocale('ar');
    fixture.detectChanges();
    open('delivery');
    press('ArrowLeft');
    expect(active()).toBe('2026-09-16');
    press('ArrowRight');
    expect(active()).toBe('2026-09-15');
  });

  it('closes on Escape and follows the form disabled state', () => {
    open('delivery');
    panel().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(form.delivery.touched).toBe(true);

    form.delivery.disable();
    fixture.detectChanges();
    expect(find<HTMLButtonElement>('#delivery').disabled).toBe(true);
  });

  it('parses and formats ISO values at every precision', () => {
    expect(parseCalendarValue('2026-02-30')).toBeNull();
    expect(parseCalendarValue('26-02-01')).toBeNull();
    expect(parseCalendarValue('2026')).toEqual({ year: 2026, month: 0, day: 1 });
    expect(parseCalendarValue('2026', true)).toEqual({ year: 2026, month: 11, day: 31 });
    expect(parseCalendarValue('2024-02', true)).toEqual({ year: 2024, month: 1, day: 29 });
    const date = { year: 2026, month: 8, day: 5 };
    expect(formatCalendarValue(date, 'day')).toBe('2026-09-05');
    expect(formatCalendarValue(date, 'month')).toBe('2026-09');
    expect(formatCalendarValue(date, 'year')).toBe('2026');
  });
});
