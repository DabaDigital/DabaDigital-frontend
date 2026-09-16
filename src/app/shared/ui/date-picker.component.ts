import { NgTemplateOutlet } from '@angular/common';
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
import type { MessageKey } from '../../core/i18n/messages/ar';
import { AnchoredPanelDirective } from './anchored-panel.directive';
import { ButtonComponent } from './button.component';
import { FORM_FIELD, joinIds } from './form-field.component';
import { IconComponent } from './icon.component';

/** What the value records: `YYYY-MM-DD`, `YYYY-MM` or `YYYY`. */
export type DatePrecision = 'day' | 'month' | 'year';
type CalendarView = 'days' | 'months' | 'years';

/** A calendar date with no time and no zone — `month` is 0-based, like `Date`. */
export interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

interface CalendarCell {
  readonly key: string;
  readonly date: CalendarDate;
  readonly text: string;
  readonly label: string;
  readonly outside: boolean;
  readonly current: boolean;
  readonly selected: boolean;
  readonly active: boolean;
  readonly disabled: boolean;
}

const YEARS_PER_PAGE = 12;
const START_VIEW: Readonly<Record<DatePrecision, CalendarView>> = {
  day: 'days',
  month: 'months',
  year: 'years',
};
const CURRENT_LABEL: Readonly<Record<DatePrecision, MessageKey>> = {
  day: 'controls.calendar.today',
  month: 'controls.calendar.thisMonth',
  year: 'controls.calendar.thisYear',
};
const DIALOG_LABEL: Readonly<Record<DatePrecision, MessageKey>> = {
  day: 'controls.calendar.chooseDay',
  month: 'controls.calendar.chooseMonth',
  year: 'controls.calendar.chooseYear',
};

let nextDatePickerId = 0;

/**
 * A date, month or year picker: a combobox trigger that opens a calendar in a
 * non-modal dialog. The value is an ISO string at the chosen `precision` and ''
 * when empty, so it round-trips through forms and the database unchanged.
 *
 * Names and digits come from `Intl` in the current app locale, the week starts on
 * the locale's first day, and the arrow keys follow the reading direction. Inside
 * the grid: arrows move, Home/End jump to the row's ends, PageUp/PageDown change
 * the page (with Shift, the year), Enter selects and Escape closes. The header
 * title opens the year view; picking a year then narrows to months and days.
 */
@Component({
  selector: 'app-date-picker',
  imports: [AnchoredPanelDirective, ButtonComponent, IconComponent, NgTemplateOutlet],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(focusout)': 'onFocusOut($event)',
  },
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePickerComponent implements ControlValueAccessor {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly field = inject(FORM_FIELD, { optional: true });
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly generatedId = `app-date-picker-${nextDatePickerId++}`;

  readonly precision = input<DatePrecision>('day');
  /** Earliest selectable value, at any precision: `2020`, `2020-03` or `2020-03-15`. */
  readonly min = input<string | null>(null);
  /** Latest selectable value; a partial bound reaches the end of its period. */
  readonly max = input<string | null>(null);
  /** 0 = Sunday … 6 = Saturday. Defaults to the locale's own first day. */
  readonly firstDayOfWeek = input<number | null>(null);
  readonly placeholder = input('');
  readonly inputId = input(this.generatedId);
  readonly name = input<string | null>(null);
  readonly describedBy = input<string | null>(null);
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model('');

  protected readonly panelId = `${this.generatedId}-panel`;
  protected readonly open = signal(false);
  protected readonly view = signal<CalendarView>('days');
  /** The focused cell — also decides which month, year or year page is shown. */
  protected readonly active = signal<CalendarDate>(localToday());
  private readonly today = signal<CalendarDate>(localToday());
  private readonly focusRequest = signal(0);
  private readonly formDisabled = signal(false);
  private readonly formatters = new Map<string, Intl.DateTimeFormat>();

  protected readonly controlId = computed(() => this.field?.controlId() ?? this.inputId());
  protected readonly describedByIds = computed(() =>
    joinIds(this.describedBy(), this.field?.describedBy()),
  );
  protected readonly isInvalid = computed(() => this.invalid() || !!this.field?.invalid());
  protected readonly isRequired = computed(() => this.required() || !!this.field?.required());
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private readonly locale = computed(() => this.i18n.meta().tag);
  private readonly selected = computed(() => parseCalendarValue(this.value()));
  private readonly minDate = computed(() => parseCalendarValue(this.min()));
  private readonly maxDate = computed(() => parseCalendarValue(this.max(), true));
  private readonly weekStart = computed(
    () => this.firstDayOfWeek() ?? localeFirstDayOfWeek(this.locale()),
  );

  protected readonly display = computed(() => {
    const date = this.selected();
    if (!date) {
      return '';
    }
    const precision = this.precision();
    return this.format(
      date,
      precision === 'year'
        ? { year: 'numeric' }
        : precision === 'month'
          ? { month: 'long', year: 'numeric' }
          : { dateStyle: 'medium' },
    );
  });
  protected readonly dialogLabel = computed(() => this.t(DIALOG_LABEL[this.precision()]));
  protected readonly currentLabel = computed(() => this.t(CURRENT_LABEL[this.precision()]));

  protected readonly yearPageStart = computed(() => {
    const year = this.active().year;
    return year - (((year % YEARS_PER_PAGE) + YEARS_PER_PAGE) % YEARS_PER_PAGE);
  });
  protected readonly title = computed(() => {
    const active = this.active();
    if (this.view() === 'years') {
      const start = this.yearPageStart();
      return `${this.formatYear(start)} – ${this.formatYear(start + YEARS_PER_PAGE - 1)}`;
    }
    return this.view() === 'days'
      ? this.format(active, { month: 'long', year: 'numeric' })
      : this.formatYear(active.year);
  });
  protected readonly previousLabel = computed(() =>
    this.t(
      this.view() === 'days'
        ? 'controls.calendar.previousMonth'
        : this.view() === 'months'
          ? 'controls.calendar.previousYear'
          : 'controls.calendar.previousYears',
    ),
  );
  protected readonly nextLabel = computed(() =>
    this.t(
      this.view() === 'days'
        ? 'controls.calendar.nextMonth'
        : this.view() === 'months'
          ? 'controls.calendar.nextYear'
          : 'controls.calendar.nextYears',
    ),
  );
  protected readonly canPrevious = computed(() => {
    const min = this.minDate();
    return !min || dayKey(this.pageBounds()[0]) > dayKey(min);
  });
  protected readonly canNext = computed(() => {
    const max = this.maxDate();
    return !max || dayKey(this.pageBounds()[1]) < dayKey(max);
  });
  protected readonly currentSelectable = computed(() => {
    const [start, end] = periodBounds(this.today(), this.precision());
    return !this.outOfRange(start, end);
  });

  protected readonly weekdays = computed(() =>
    Array.from({ length: 7 }, (_, index) => {
      // 4 January 1970 was a Sunday, so day 4 + n falls on weekday n.
      const date = { year: 1970, month: 0, day: 4 + ((this.weekStart() + index) % 7) };
      return {
        key: index,
        short: this.format(date, { weekday: 'short' }),
        long: this.format(date, { weekday: 'long' }),
      };
    }),
  );
  /** Always six rows, so the panel keeps its height from month to month. */
  protected readonly weeks = computed<CalendarCell[][]>(() => {
    const active = this.active();
    const first = { year: active.year, month: active.month, day: 1 };
    const start = addDays(first, -this.weekdayIndex(first));
    return Array.from({ length: 6 }, (_, week) =>
      Array.from({ length: 7 }, (_, weekday) =>
        this.dayCell(addDays(start, week * 7 + weekday), active),
      ),
    );
  });
  protected readonly monthRows = computed<CalendarCell[][]>(() => {
    const active = this.active();
    return Array.from({ length: 4 }, (_, row) =>
      Array.from({ length: 3 }, (_, column) => this.monthCell(row * 3 + column, active)),
    );
  });
  protected readonly yearRows = computed<CalendarCell[][]>(() => {
    const start = this.yearPageStart();
    const active = this.active();
    return Array.from({ length: 3 }, (_, row) =>
      Array.from({ length: 4 }, (_, column) => this.yearCell(start + row * 4 + column, active)),
    );
  });

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    // Keyboard moves re-render the grid; focus follows once the new cell exists.
    afterRenderEffect(() => {
      if (this.focusRequest() > 0) {
        this.panel()?.nativeElement.querySelector<HTMLElement>('[data-active]')?.focus();
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
      this.close(false);
    }
  }

  protected toggle(): void {
    if (this.isDisabled()) {
      return;
    }
    if (this.open()) {
      this.close(false);
    } else {
      this.openPanel();
    }
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled() || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) {
      return;
    }
    event.preventDefault();
    if (this.open()) {
      this.requestFocus();
    } else {
      this.openPanel();
    }
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      // Cancelling the keydown also stops an enclosing modal dialog from closing.
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
      return;
    }
    if (!(event.target instanceof HTMLElement) || !event.target.hasAttribute('data-cell')) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      // Pick the active cell, not whichever button holds focus: a key pressed
      // before focus has caught up with the last arrow must not pick a stale day.
      event.preventDefault();
      const cell = this.cells().find((candidate) => candidate.active);
      if (cell) {
        this.pick(cell);
      }
      return;
    }
    const next = this.keyTarget(event);
    if (next) {
      event.preventDefault();
      this.active.set(this.clamp(next));
      this.focusActive();
    }
  }

  protected pick(cell: CalendarCell): void {
    if (cell.disabled) {
      return;
    }
    const view = this.view();
    const precision = this.precision();
    if (view === 'years' && precision !== 'year') {
      this.drillDown(cell.date, 'months');
    } else if (view === 'months' && precision === 'day') {
      this.drillDown(cell.date, 'days');
    } else {
      this.commit(formatCalendarValue(cell.date, precision));
      this.close(true);
    }
  }

  protected showYears(): void {
    this.view.set('years');
    this.requestFocus();
  }

  protected pageBy(direction: 1 | -1): void {
    const view = this.view();
    const months = view === 'days' ? 1 : view === 'months' ? 12 : 12 * YEARS_PER_PAGE;
    this.active.set(this.clamp(addMonths(this.active(), months * direction)));
  }

  protected pickCurrent(): void {
    this.commit(formatCalendarValue(this.today(), this.precision()));
    this.close(true);
  }

  protected clear(): void {
    this.commit('');
    this.close(true);
  }

  protected onDocumentClick(event: MouseEvent): void {
    // The path is fixed at dispatch time, so a cell re-rendered away by its own
    // click still counts as inside.
    if (this.open() && !event.composedPath().includes(this.host.nativeElement)) {
      this.close(false);
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (this.open() && next instanceof Node && !this.host.nativeElement.contains(next)) {
      this.close(false);
    }
  }

  private openPanel(): void {
    this.today.set(localToday());
    this.active.set(this.clamp(this.selected() ?? this.today()));
    this.view.set(START_VIEW[this.precision()]);
    this.open.set(true);
    this.requestFocus();
  }

  private close(returnFocus: boolean): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.onTouched();
    if (returnFocus) {
      this.trigger().nativeElement.focus();
    }
  }

  private drillDown(date: CalendarDate, view: CalendarView): void {
    this.active.set(this.clamp(date));
    this.view.set(view);
    this.requestFocus();
  }

  private commit(value: string): void {
    this.value.set(value);
    this.onChange(value);
  }

  private requestFocus(): void {
    this.focusRequest.update((count) => count + 1);
  }

  /**
   * Focus follows the active cell at once when it is already on the page, so the
   * next key lands on it; a new page's cells only exist after the render.
   */
  private focusActive(): void {
    const cell = this.cells().find((candidate) => candidate.active);
    const element =
      cell && this.panel()?.nativeElement.querySelector<HTMLElement>(`[data-date="${cell.key}"]`);
    if (element) {
      element.focus();
    } else {
      this.requestFocus();
    }
  }

  private cells(): CalendarCell[] {
    const view = this.view();
    const rows =
      view === 'days' ? this.weeks() : view === 'months' ? this.monthRows() : this.yearRows();
    return rows.flat();
  }

  private keyTarget(event: KeyboardEvent): CalendarDate | null {
    const active = this.active();
    const horizontal = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    // Arrows follow the reading direction: in Arabic, Left is the next day.
    const step = this.i18n.dir() === 'rtl' ? -horizontal : horizontal;
    const view = this.view();
    const unit = view === 'days' ? 0 : view === 'months' ? 1 : 12;
    if (step !== 0) {
      return view === 'days' ? addDays(active, step) : addMonths(active, unit * step);
    }
    const page = event.shiftKey && view === 'days' ? 12 : view === 'days' ? 1 : unit * 12;
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown': {
        const direction = event.key === 'ArrowUp' ? -1 : 1;
        return view === 'days'
          ? addDays(active, 7 * direction)
          : addMonths(active, (view === 'months' ? 3 : 48) * direction);
      }
      case 'PageUp':
        return addMonths(active, -page);
      case 'PageDown':
        return addMonths(active, page);
      case 'Home':
      case 'End': {
        const end = event.key === 'End';
        if (view === 'days') {
          const index = this.weekdayIndex(active);
          return addDays(active, end ? 6 - index : -index);
        }
        return view === 'months'
          ? withMonth(active, active.year, end ? 11 : 0)
          : withMonth(active, this.yearPageStart() + (end ? YEARS_PER_PAGE - 1 : 0), active.month);
      }
      default:
        return null;
    }
  }

  private dayCell(date: CalendarDate, active: CalendarDate): CalendarCell {
    const selected = this.selected();
    return {
      key: formatCalendarValue(date, 'day'),
      date,
      text: this.format(date, { day: 'numeric' }),
      label: this.format(date, { dateStyle: 'full' }),
      outside: date.month !== active.month,
      current: sameDay(date, this.today()),
      selected: selected !== null && sameDay(date, selected),
      active: sameDay(date, active),
      disabled: this.outOfRange(date, date),
    };
  }

  private monthCell(month: number, active: CalendarDate): CalendarCell {
    const date = withMonth(active, active.year, month);
    const [start, end] = periodBounds(date, 'month');
    const selected = this.selected();
    const today = this.today();
    return {
      key: formatCalendarValue(date, 'month'),
      date,
      text: this.format(start, { month: 'short' }),
      label: this.format(start, { month: 'long', year: 'numeric' }),
      outside: false,
      current: today.year === date.year && today.month === month,
      selected: selected !== null && selected.year === date.year && selected.month === month,
      active: active.month === month,
      disabled: this.outOfRange(start, end),
    };
  }

  private yearCell(year: number, active: CalendarDate): CalendarCell {
    const date = withMonth(active, year, active.month);
    const [start, end] = periodBounds(date, 'year');
    const text = this.formatYear(year);
    return {
      key: String(year),
      date,
      text,
      label: text,
      outside: false,
      current: this.today().year === year,
      selected: this.selected()?.year === year,
      active: active.year === year,
      disabled: this.outOfRange(start, end),
    };
  }

  /** True when no day of `start`–`end` lies inside `min`–`max`. */
  private outOfRange(start: CalendarDate, end: CalendarDate): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    return (
      (min !== null && dayKey(end) < dayKey(min)) || (max !== null && dayKey(start) > dayKey(max))
    );
  }

  private clamp(date: CalendarDate): CalendarDate {
    const min = this.minDate();
    const max = this.maxDate();
    if (min && dayKey(date) < dayKey(min)) {
      return min;
    }
    return max && dayKey(date) > dayKey(max) ? max : date;
  }

  private pageBounds(): readonly [CalendarDate, CalendarDate] {
    const view = this.view();
    if (view === 'years') {
      const start = this.yearPageStart();
      return [
        { year: start, month: 0, day: 1 },
        { year: start + YEARS_PER_PAGE - 1, month: 11, day: 31 },
      ];
    }
    return periodBounds(this.active(), view === 'days' ? 'month' : 'year');
  }

  private weekdayIndex(date: CalendarDate): number {
    return (toUtc(date).getUTCDay() - this.weekStart() + 7) % 7;
  }

  private formatYear(year: number): string {
    return this.format({ year, month: 0, day: 1 }, { year: 'numeric' });
  }

  private format(date: CalendarDate, options: Intl.DateTimeFormatOptions): string {
    const locale = this.locale();
    const key = `${locale}|${JSON.stringify(options)}`;
    let formatter = this.formatters.get(key);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
      this.formatters.set(key, formatter);
    }
    return formatter.format(toUtc(date));
  }
}

/** Parses `YYYY`, `YYYY-MM` or `YYYY-MM-DD`; missing parts fall to the period's start, or its end. */
export function parseCalendarValue(
  value: string | null | undefined,
  end = false,
): CalendarDate | null {
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value ?? '');
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = match[2] === undefined ? (end ? 11 : 0) : Number(match[2]) - 1;
  if (month < 0 || month > 11) {
    return null;
  }
  const last = daysInMonth(year, month);
  const day = match[3] === undefined ? (end ? last : 1) : Number(match[3]);
  return day >= 1 && day <= last ? { year, month, day } : null;
}

export function formatCalendarValue(date: CalendarDate, precision: DatePrecision): string {
  const year = String(date.year).padStart(4, '0');
  if (precision === 'year') {
    return year;
  }
  const month = `${year}-${String(date.month + 1).padStart(2, '0')}`;
  return precision === 'month' ? month : `${month}-${String(date.day).padStart(2, '0')}`;
}

function localToday(): CalendarDate {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function toUtc(date: CalendarDate): Date {
  return new Date(Date.UTC(date.year, date.month, date.day));
}

function addDays(date: CalendarDate, days: number): CalendarDate {
  const moved = new Date(Date.UTC(date.year, date.month, date.day + days));
  return { year: moved.getUTCFullYear(), month: moved.getUTCMonth(), day: moved.getUTCDate() };
}

function addMonths(date: CalendarDate, months: number): CalendarDate {
  const first = new Date(Date.UTC(date.year, date.month + months, 1));
  return withMonth(date, first.getUTCFullYear(), first.getUTCMonth());
}

/** Moves to another month, keeping the day where that month has it. */
function withMonth(date: CalendarDate, year: number, month: number): CalendarDate {
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

function periodBounds(
  date: CalendarDate,
  precision: DatePrecision,
): readonly [CalendarDate, CalendarDate] {
  if (precision === 'day') {
    return [date, date];
  }
  if (precision === 'month') {
    return [
      { year: date.year, month: date.month, day: 1 },
      { year: date.year, month: date.month, day: daysInMonth(date.year, date.month) },
    ];
  }
  return [
    { year: date.year, month: 0, day: 1 },
    { year: date.year, month: 11, day: 31 },
  ];
}

function sameDay(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function dayKey(date: CalendarDate): number {
  return date.year * 10_000 + date.month * 100 + date.day;
}

/** CLDR's first day of the week for a locale (Monday in Morocco and France), as 0–6. */
function localeFirstDayOfWeek(tag: string): number {
  try {
    const locale = new Intl.Locale(tag) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const info = locale.getWeekInfo?.() ?? locale.weekInfo;
    if (info) {
      return info.firstDay % 7;
    }
  } catch {
    // Older engines lack week data; Monday suits every locale the site ships.
  }
  return 1;
}
