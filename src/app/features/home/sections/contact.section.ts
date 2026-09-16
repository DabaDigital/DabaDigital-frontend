import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { environment } from '../../../../environments/environment';
import { ContactApi } from '../../../core/api/contact.api';
import { ContentStore } from '../../../core/content.store';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { MessageKey } from '../../../core/i18n/messages/ar';
import {
  emptyProjectFormState,
  type Budget,
  type BudgetRange,
  type ProjectFormState,
  type ProjectType,
  type VoiceFillableField,
} from '../../../core/models/project-form.model';
import type { VoiceOperationDto } from '../../../core/models/voice-operation.model';
import type { RecorderErrorReason, RecorderState } from '../../../core/models/voice-session.model';
import {
  acceptSuggestion,
  mergeVoiceOperations,
  revertToManualEmpty,
  type FieldSuggestion,
} from '../../../core/voice/field-merge';
import { RealtimeVoiceService } from '../../../core/voice/realtime-voice.service';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { SectionSpyDirective } from '../../../shared/directives/section-spy';
import { AiBadgeComponent } from '../../../shared/ui/ai-badge.component';
import { ButtonComponent } from '../../../shared/ui/button.component';
import {
  DropdownListComponent,
  type DropdownOption,
} from '../../../shared/ui/dropdown-list.component';
import { FormFieldComponent } from '../../../shared/ui/form-field.component';
import { InputDirective } from '../../../shared/ui/input.directive';
import { IconComponent } from '../../../shared/ui/icon.component';
import { SuggestionChipComponent } from '../../../shared/ui/suggestion-chip.component';
// Shared with the admin inbox, which reads the same labels back.
import { PROJECT_TYPES } from '../../../core/project-types';

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
 * Section 5 — the contact form, manual **and** voice.
 *
 * Two parallel layers stay in sync in exactly one place, this component
 * (CLAUDE.md § Conventions): the typed `form` (the input surface — what's
 * actually submitted) and the `fields` signal (`ProjectFormState`, the
 * provenance layer — who last set each value and how sure the assistant
 * was). A voice update patches `form` with `{ emitEvent: false }` so it
 * never re-triggers the manual-edit listeners below; a genuine keystroke or
 * selection always goes through `valueChanges`, which is the *only* path
 * that marks a field `'manual'`. That asymmetry is what makes "manual wins,
 * permanently" (invariant 2) hold without a separate lock flag to fall out
 * of sync with the form.
 *
 * Validation timing is otherwise unchanged from the manual-only version of
 * this form: text controls are `updateOn: 'blur'`, the selects stay on
 * `'change'`, errors show once a control is `touched` or after a submit
 * attempt. See the original comment history for why.
 */
@Component({
  selector: 'app-contact-section',
  imports: [
    ReactiveFormsModule,
    AiBadgeComponent,
    ButtonComponent,
    DropdownListComponent,
    FormFieldComponent,
    InputDirective,
    IconComponent,
    RevealDirective,
    SectionSpyDirective,
    SuggestionChipComponent,
  ],
  templateUrl: './contact.section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSection {
  private readonly i18n = inject(I18nService);
  private readonly api = inject(ContactApi);
  private readonly voice = inject(RealtimeVoiceService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly document = inject(DOCUMENT);

  protected readonly t = this.i18n.t;
  // Read through a getter so separate Vitest entry bundles do not capture a
  // partially initialized module namespace while component specs run together.
  protected readonly content = inject(ContentStore);
  protected get contactEmail(): string {
    return (
      this.content
        .contact()
        .find((channel) => channel.href.startsWith('mailto:'))
        ?.href.slice(7) ?? ''
    );
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

  // ── Voice assistant ───────────────────────────────────────────────────

  protected readonly voiceEnabled = environment.voice.enabled;
  protected readonly voiceSupported = RealtimeVoiceService.isSupported();
  protected readonly recorderState = this.voice.recorderState;
  protected readonly transcript = this.voice.transcript;
  protected readonly voiceErrorReason = this.voice.errorReason;
  protected readonly isRecording = computed(() => {
    const state = this.recorderState();
    return state === 'recording' || state === 'connecting' || state === 'requesting-permission';
  });

  /** Shown once per page load until the visitor starts their first recording — see
   * frontend README § Privacy notice. Clicking the mic button is itself the acknowledgement. */
  protected readonly privacyAcknowledged = signal(false);

  protected readonly fields = signal<ProjectFormState>(emptyProjectFormState());
  protected readonly suggestions = signal<readonly FieldSuggestion[]>([]);

  /** `aria-live="polite"` text — recorder state changes and applied fields are announced so the
   * form is usable without watching it (CLAUDE.md § Accessibility). */
  protected readonly announcement = signal('');

  constructor() {
    this.wireManualEditDetection();

    // A completed turn -> merge -> sync both layers. This is the one place `fields` and `form`
    // are written from voice input, matching the "keep both in sync in one place" rule above.
    // `untracked` around the body, not just the `fields` read inside it: `applyExtractResult`
    // both reads `this.fields()` (to merge against) and writes it (`this.fields.set(...)`). Left
    // tracked, that write would register as a change to a dependency *this same effect* just
    // read, rescheduling it — which reads `fields` again, writes a new object again (every merge
    // call returns a fresh object), and reschedules again: an infinite loop, confirmed the hard
    // way (a real run against `contact.section.spec.ts` OOM'd the process). `lastResult` is the
    // only signal this effect should ever react to — a new turn completing, not this effect's own
    // side effects on `fields`/`suggestions`/`announcement`/the form.
    effect(() => {
      const result = this.voice.lastResult();
      if (result) {
        untracked(() => this.applyExtractResult(result.operations));
      }
    });

    effect(() => {
      const state = this.recorderState();
      const reason = this.voiceErrorReason();
      this.announcement.set(this.recorderStateAnnouncement(state, reason));
    });
  }

  /** True when the field should be showing its error message right now. */
  protected showsError(field: (typeof FIELD_ORDER)[number]): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted());
  }

  /** The message the field shows right now; '' while it should not show one. */
  protected fieldError(field: (typeof FIELD_ORDER)[number]): string {
    if (!this.showsError(field)) {
      return '';
    }
    // Two different failures, two different fixes.
    const missing = this.form.controls[field].hasError('required');
    switch (field) {
      case 'fullName':
        return this.t('contact.name.error');
      case 'email':
        return this.t(missing ? 'contact.email.errorRequired' : 'contact.email.errorFormat');
      case 'projectType':
        return this.t('contact.type.error');
      case 'message':
        return this.t(missing ? 'contact.message.errorRequired' : 'contact.message.errorShort');
    }
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

    // Voice is fully switched off — nothing leaves the browser as a project request until this
    // click, and that must hold whether or not a single word was ever spoken (invariant 1).
    if (this.isRecording()) {
      this.voice.stop();
    }

    this.errorCount.set(0);
    this.status.set('submitting');

    this.api
      .submit({
        fullName: value.fullName,
        email: value.email,
        companyName: value.company,
        projectType,
        budget:
          value.budget === '' ? null : { range: value.budget, raw: this.budgetLabel(value.budget) },
        description: value.message,
        locale: this.i18n.locale(),
        fieldSources: this.fields(),
      })
      .subscribe({
        next: () => {
          this.sent.set({ name: value.fullName.trim(), email: value.email.trim() });
          this.status.set('success');
          this.form.reset();
          this.fields.set(emptyProjectFormState());
          this.suggestions.set([]);
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

  protected async toggleRecording(): Promise<void> {
    if (this.isRecording()) {
      this.voice.stop();
      return;
    }
    this.privacyAcknowledged.set(true);
    await this.voice.start(() => this.fields(), environment.voice.defaultLanguage);
  }

  protected undoField(field: VoiceFillableField): void {
    const next = revertToManualEmpty(this.fields(), field, Date.now());
    this.fields.set(next);
    this.syncFormFromFields(next);
  }

  protected acceptSuggestionChip(suggestion: FieldSuggestion): void {
    const next = acceptSuggestion(this.fields(), suggestion, Date.now());
    this.fields.set(next);
    this.syncFormFromFields(next);
    this.suggestions.update((list) => list.filter((item) => item !== suggestion));
  }

  protected dismissSuggestion(suggestion: FieldSuggestion): void {
    this.suggestions.update((list) => list.filter((item) => item !== suggestion));
  }

  protected suggestionText(suggestion: FieldSuggestion): string {
    const label = this.fieldLabel(suggestion.field);
    if (typeof suggestion.value === 'string') {
      return `${label} : ${suggestion.value}`;
    }
    const budget = suggestion.value;
    const value = budget?.raw ?? this.budgetLabel(budget?.range ?? '');
    return `${label} : ${value}`;
  }

  protected voiceUnavailableMessage(): string {
    const reason = this.voiceErrorReason();
    switch (reason) {
      case 'permission-denied':
        return this.t('contact.voice.errorPermission');
      case 'insecure-context':
      case 'unsupported-browser':
        return this.t('contact.voice.unsupported');
      case 'session-unavailable':
      case 'connection-failed':
        return this.t('contact.voice.errorUnavailable');
      default:
        return this.t('contact.voice.errorUnavailable');
    }
  }

  private applyExtractResult(operations: readonly VoiceOperationDto[]): void {
    const now = Date.now();
    const merged = mergeVoiceOperations(this.fields(), operations, now);
    this.fields.set(merged.fields);
    if (merged.suggestions.length > 0) {
      this.suggestions.update((current) => [...current, ...merged.suggestions]);
    }
    this.syncFormFromFields(merged.fields);

    const appliedFields = operations
      .filter((operation) => operation.status === 'applied')
      .map((operation) => `${this.fieldLabelForWire(operation.field)} : ${operation.evidence}`);
    if (appliedFields.length > 0) {
      this.announcement.set(appliedFields.join('. '));
    }
  }

  /** Programmatic only — `emitEvent: false` is what keeps this from being mistaken for a manual
   * edit by the listeners set up in `wireManualEditDetection`. */
  private syncFormFromFields(fields: ProjectFormState): void {
    this.form.patchValue(
      {
        fullName: fields.fullName.value ?? '',
        email: fields.email.value ?? '',
        company: fields.companyName.value ?? '',
        projectType: fields.projectType.value ?? '',
        budget: fields.budget.value?.range ?? '',
        message: fields.description.value ?? '',
      },
      { emitEvent: false },
    );
  }

  /** The *only* place a field's `source` becomes `'manual'` — every control's `valueChanges`,
   * which never fires for a voice-driven `patchValue` (see `syncFormFromFields`). */
  private wireManualEditDetection(): void {
    const now = () => Date.now();

    this.form.controls.fullName.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.fields.update((f) => ({ ...f, fullName: this.manualField(value || null, now()) }));
    });
    this.form.controls.email.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.fields.update((f) => ({ ...f, email: this.manualField(value || null, now()) }));
    });
    this.form.controls.company.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.fields.update((f) => ({ ...f, companyName: this.manualField(value || null, now()) }));
    });
    this.form.controls.projectType.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.fields.update((f) => ({
        ...f,
        projectType: this.manualField(value === '' ? null : value, now()),
      }));
    });
    this.form.controls.budget.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      const budget: Budget | null =
        value === '' ? null : { range: value, raw: this.budgetLabel(value) };
      this.fields.update((f) => ({ ...f, budget: this.manualField(budget, now()) }));
    });
    this.form.controls.message.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.fields.update((f) => ({ ...f, description: this.manualField(value || null, now()) }));
    });
  }

  private manualField<T>(value: T | null, now: number) {
    return { value, source: 'manual' as const, confidence: null, evidence: null, updatedAt: now };
  }

  private fieldLabel(field: VoiceFillableField): string {
    const keys: Record<VoiceFillableField, MessageKey> = {
      fullName: 'contact.name.label',
      email: 'contact.email.label',
      companyName: 'contact.company.label',
      projectType: 'contact.type.label',
      budget: 'contact.budget.label',
      description: 'contact.message.label',
    };
    return this.t(keys[field]);
  }

  private fieldLabelForWire(wireField: string): string {
    const map: Record<string, VoiceFillableField> = {
      full_name: 'fullName',
      email: 'email',
      company_name: 'companyName',
      project_type: 'projectType',
      budget: 'budget',
      description: 'description',
    };
    const field = map[wireField];
    return field ? this.fieldLabel(field) : wireField;
  }

  private recorderStateAnnouncement(
    state: RecorderState,
    reason: RecorderErrorReason | null,
  ): string {
    switch (state) {
      case 'requesting-permission':
        return this.t('contact.voice.stateRequestingPermission');
      case 'connecting':
        return this.t('contact.voice.stateConnecting');
      case 'recording':
        return this.t('contact.voice.listening');
      case 'processing':
        return this.t('contact.voice.stateProcessing');
      case 'error':
        return reason === 'permission-denied'
          ? this.t('contact.voice.errorPermission')
          : this.t('contact.voice.errorUnavailable');
      default:
        return '';
    }
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
