import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ContactApi, type BudgetRange } from '../../../core/api/contact.api';
import { COMPANY } from '../../../core/company';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { MessageKey } from '../../../core/i18n/messages/ar';
import type { ProjectType } from '../../../core/models/project-form.model';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { SectionSpyDirective } from '../../../shared/directives/section-spy';
import { ButtonComponent } from '../../../shared/ui/button.component';
import {
  DropdownListComponent,
  type DropdownOption,
} from '../../../shared/ui/dropdown-list.component';
import { InputDirective } from '../../../shared/ui/input.directive';
import { IconComponent } from '../../../shared/ui/icon.component';

/** Project types, in the order they are offered. Values are the backend enum. */
const PROJECT_TYPES: readonly { value: ProjectType; labelKey: MessageKey }[] = [
  { value: 'website', labelKey: 'contact.type.website' },
  { value: 'web_app', labelKey: 'contact.type.webapp' },
  { value: 'ecommerce', labelKey: 'contact.type.ecommerce' },
  { value: 'mobile_app', labelKey: 'contact.type.mobile' },
  { value: 'other', labelKey: 'contact.type.other' },
];

const BUDGET_RANGES: readonly { value: BudgetRange | ''; labelKey: MessageKey }[] = [
  { value: 's', labelKey: 'contact.budget.s' },
  { value: 'm', labelKey: 'contact.budget.m' },
  { value: 'l', labelKey: 'contact.budget.l' },
  { value: 'xl', labelKey: 'contact.budget.xl' },
  { value: '', labelKey: 'contact.budget.unknown' },
];

/** The order errors are reported and focus is moved in — visual order. */
const FIELD_ORDER = ['fullName', 'email', 'projectType', 'message'] as const;

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Section 5 — the contact form.
 *
 * Validation timing is the part worth reading. Text controls are `updateOn:
 * 'blur'`, so nobody is told their email is invalid while they are still typing
 * the local part; the selects stay on `'change'`, because a select's value is
 * only ever complete. Errors are then shown when the control is `touched` *or*
 * after a submit attempt, which covers the visitor who submits an untouched form.
 *
 * The submit button is never disabled on an invalid form. A disabled button gives
 * no reason and cannot be focused to ask for one — submitting and being moved to
 * the first problem, with a counted summary above the form, tells the visitor
 * what is actually wrong.
 */
@Component({
  selector: 'app-contact-section',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    DropdownListComponent,
    InputDirective,
    IconComponent,
    RevealDirective,
    SectionSpyDirective,
  ],
  templateUrl: './contact.section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSection {
  private readonly i18n = inject(I18nService);
  private readonly api = inject(ContactApi);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly document = inject(DOCUMENT);

  protected readonly t = this.i18n.t;
  // Read through a getter so separate Vitest entry bundles do not capture a
  // partially initialized module namespace while component specs run together.
  protected get details(): typeof COMPANY {
    return COMPANY;
  }
  protected readonly projectTypes = PROJECT_TYPES;
  protected readonly budgetRanges = BUDGET_RANGES;

  protected projectTypeOptions(): readonly DropdownOption[] {
    return this.projectTypes.map((option) => ({
      value: option.value,
      label: this.t(option.labelKey),
    }));
  }

  protected budgetOptions(): readonly DropdownOption[] {
    return this.budgetRanges.map((option) => ({
      value: option.value,
      label: this.t(option.labelKey),
    }));
  }

  protected readonly status = signal<FormStatus>('idle');
  /** Flips on the first submit, so untouched invalid controls start showing errors. */
  protected readonly submitted = signal(false);
  /** How many controls failed on the last attempt — the number in the summary. */
  protected readonly errorCount = signal(0);
  /** Name and email of the accepted request, for the confirmation panel. */
  protected readonly sent = signal<{ name: string; email: string } | null>(null);

  protected readonly form = this.fb.group({
    // `updateOn: 'blur'` per control rather than on the group: a select must
    // commit on change, or its value lags a tab behind what is on screen.
    fullName: this.fb.control('', {
      validators: [Validators.required],
      updateOn: 'blur',
    }),
    email: this.fb.control('', {
      validators: [Validators.required, Validators.email],
      updateOn: 'blur',
    }),
    company: this.fb.control('', { updateOn: 'blur' }),
    projectType: this.fb.control<ProjectType | ''>('', { validators: [Validators.required] }),
    budget: this.fb.control<BudgetRange | ''>(''),
    message: this.fb.control('', {
      validators: [Validators.required, Validators.minLength(20)],
      updateOn: 'blur',
    }),
  });

  /** True when the field should be showing its error message right now. */
  protected showsError(field: (typeof FIELD_ORDER)[number]): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted());
  }

  protected onSubmit(): void {
    if (this.status() === 'submitting') {
      return;
    }

    // `updateOn: 'blur'` means a control the visitor is still inside has not
    // pushed its value to the model yet. Pressing Enter in a text input submits
    // without ever firing that blur, so the form would validate against a stale
    // empty string. Blurring first is what makes Enter and click agree.
    const focused = this.document.activeElement;
    if (focused instanceof HTMLElement) {
      focused.blur();
    }

    this.submitted.set(true);
    this.form.markAllAsTouched();

    const invalid = FIELD_ORDER.filter((field) => this.form.controls[field].invalid);
    if (invalid.length > 0) {
      this.errorCount.set(invalid.length);
      this.status.set('idle');
      this.focusField(invalid[0]);
      return;
    }

    const value = this.form.getRawValue();
    const projectType = value.projectType;
    if (projectType === '') {
      // Unreachable — `required` on `projectType` has just passed. Narrowing the
      // union here rather than casting is what keeps `ProjectType` honest.
      return;
    }

    this.errorCount.set(0);
    this.status.set('submitting');

    this.api
      .submit({
        fullName: value.fullName,
        email: value.email,
        companyName: value.company,
        projectType,
        budget: value.budget === '' ? null : value.budget,
        budgetLabel: this.budgetLabel(value.budget),
        description: value.message,
        locale: this.i18n.locale(),
      })
      .subscribe({
        next: () => {
          this.sent.set({ name: value.fullName.trim(), email: value.email.trim() });
          this.status.set('success');
          this.form.reset();
          this.submitted.set(false);
        },
        error: () => this.status.set('error'),
      });
  }

  /** Back to an empty form after a success, for a visitor sending a second request. */
  protected reset(): void {
    this.sent.set(null);
    this.errorCount.set(0);
    this.status.set('idle');
  }

  private budgetLabel(range: BudgetRange | ''): string {
    const match = BUDGET_RANGES.find((option) => option.value === range);
    return match ? this.t(match.labelKey) : '';
  }

  /**
   * WCAG 3.3.1: after a failed submit, focus moves to the first field that needs
   * attention, so the error is where the cursor is rather than somewhere above.
   */
  private focusField(field: (typeof FIELD_ORDER)[number]): void {
    this.document.getElementById(`contact-${field}`)?.focus();
  }
}
