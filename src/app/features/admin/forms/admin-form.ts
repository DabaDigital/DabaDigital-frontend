import {
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
  type AbstractControl,
  type FormControl,
  type ValidationErrors,
  type ValidatorFn,
} from '@angular/forms';

import { ContentStore } from '../../../core/content.store';
import { I18nService } from '../../../core/i18n/i18n.service';
import type {
  ContentRecord,
  LocalizedText,
  PublicationStatus,
} from '../../../core/models/content.model';
import type { DropdownOption } from '../../../shared/ui/dropdown-list.component';

/** The id every section's form takes, so the dialog's Save button submits whichever is open. */
export const ADMIN_FORM_ID = 'admin-editor-form';

export const LOCALES = [
  { id: 'en', label: 'English', dir: 'ltr' },
  { id: 'fr', label: 'Français', dir: 'ltr' },
  { id: 'ar', label: 'العربية', dir: 'rtl' },
] as const;

export type LocalizedGroup = FormGroup<{
  en: FormControl<string>;
  fr: FormControl<string>;
  ar: FormControl<string>;
}>;

// ── Checks ──────────────────────────────────────────────────────────────────
// Each one mirrors a constraint in supabase/migrations, so the form never
// accepts a value the database would then refuse with a generic error.

/** The database's own link pattern: `^https?://[^[:space:]]+$`. */
const WEB_LINK = /^https?:\/\/\S+$/;
const EMAIL_LINK = /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_LINK = /^tel:[+\d ()-]+$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** No colon before the @, so `mailto:x@y.z` is a link, never an address to link to again. */
const EMAIL = /^[^\s@:]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s().-]{6,}$/;
/** An email address, with or without `mailto:` or an `https://` pasted in front of it. */
const EMAIL_LIKE = /^(?:https?:\/\/)?(?:mailto:)?[^\s@/:]+@[^\s@/]+\.[^\s@/]+$/i;

/**
 * An http(s) page a visitor can open: the database's pattern, a host with a dot
 * (or localhost), and no credentials. That last rule is what refuses
 * `https://mailto:hello@studio.ma`, which a URL parser reads as the user
 * "mailto" on the host "studio.ma": an email address with https:// in front.
 */
export function isWebLink(value: string): boolean {
  if (!WEB_LINK.test(value)) return false;
  try {
    const url = new URL(value);
    return (
      !url.username && !url.password && (url.hostname === 'localhost' || url.hostname.includes('.'))
    );
  } catch {
    return false;
  }
}

/** A contact channel's link: a web page, an email or a phone number. */
export function isContactLink(value: string): boolean {
  return isWebLink(value) || EMAIL_LINK.test(value) || PHONE_LINK.test(value);
}

const trimmedValue = (control: AbstractControl): string =>
  typeof control.value === 'string' ? control.value.trim() : '';

/** Required, and more than spaces. */
export const filled: ValidatorFn = (control) => (trimmedValue(control) ? null : { required: true });

/** An optional web page, with its own message when an email address was typed instead. */
export const webLink: ValidatorFn = (control) => {
  const value = trimmedValue(control);
  if (!value || isWebLink(value)) return null;
  return EMAIL_LIKE.test(value) ? { emailLink: true } : { webLink: true };
};

/** An optional contact link: a web page, `mailto:` or `tel:`. */
export const contactLink: ValidatorFn = (control) => {
  const value = trimmedValue(control);
  return !value || isContactLink(value) ? null : { contactLink: true };
};

/** Text that visitors read: a `mailto:` or `tel:` link belongs in the link field. */
export const readableText: ValidatorFn = (control) =>
  /^(?:mailto|tel):/i.test(trimmedValue(control)) ? { linkAsText: true } : null;

export const slugFormat: ValidatorFn = (control) => {
  const value = trimmedValue(control);
  return !value || SLUG.test(value) ? null : { slug: true };
};

export const yearFormat: ValidatorFn = (control) =>
  /^\d{4}$/.test(trimmedValue(control)) ? null : { year: true };

/** A whole number in range. The stepper reports an emptied field as null, whatever its type says. */
export function wholeNumber(min: number, max: number): ValidatorFn {
  return ({ value }) =>
    typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
      ? null
      : { range: { min, max } };
}

/**
 * One text in English, French and Arabic. Only English can be required: it is
 * the fallback the website shows for an empty translation.
 */
export function localizedGroup(
  fb: NonNullableFormBuilder,
  maxLength: number,
  options: { required?: boolean; validators?: ValidatorFn[] } = {},
): LocalizedGroup {
  const shared = [Validators.maxLength(maxLength), ...(options.validators ?? [])];
  return fb.group({
    en: ['', options.required ? [filled, ...shared] : shared],
    fr: ['', shared],
    ar: ['', shared],
  });
}

export function trimmed(value: LocalizedText): LocalizedText {
  return { en: value.en.trim(), fr: value.fr.trim(), ar: value.ar.trim() };
}

/** "Atlas Platform" → "atlas-platform". Accents are dropped, and so is any other non-Latin text. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** The link that opens an email address or a phone number, or '' for any other text. */
export function linkFor(value: string): string {
  const text = value.trim();
  if (EMAIL.test(text)) return `mailto:${text}`;
  if (PHONE.test(text)) return `tel:${text.replace(/[^\d+]/g, '')}`;
  return '';
}

/** How many single fields are invalid, each language of a text counting as one. */
export function countInvalid(control: AbstractControl): number {
  if (control instanceof FormGroup || control instanceof FormArray) {
    return Object.values<AbstractControl>(control.controls).reduce(
      (count, child) => count + countInvalid(child),
      0,
    );
  }
  return control.invalid ? 1 : 0;
}

/** The message for a control's first problem, in the dashboard's language. */
export function errorMessage(errors: ValidationErrors, t: I18nService['t']): string {
  const [key] = Object.keys(errors);
  switch (key) {
    case 'required':
      return t('admin.errors.required');
    case 'maxlength':
      return t('admin.errors.tooLong', {
        max: (errors['maxlength'] as { requiredLength: number }).requiredLength,
      });
    case 'webLink':
      return t('admin.errors.webLink');
    case 'emailLink':
      return t('admin.errors.emailLink');
    case 'contactLink':
      return t('admin.errors.contactLink');
    case 'linkAsText':
      return t('admin.errors.linkAsText');
    case 'slug':
      return t('admin.errors.slug');
    case 'year':
      return t('admin.errors.year');
    case 'range':
      return t('admin.errors.range', errors['range'] as { min: number; max: number });
    default:
      return t('admin.errors.invalid');
  }
}

/**
 * What every section's form shares; the fields, their rules and how a record
 * maps onto them belong to each section's own form.
 *
 * A field shows its problem once it has been changed and left, or for every
 * field after a save attempt — not while someone is still on their way through
 * the form. A refused save tells the dialog how many fields need fixing and
 * moves focus to the first, which scrolls the dialog to it.
 */
@Directive()
export abstract class AdminForm<T extends ContentRecord> implements OnInit {
  readonly record = input<T | null>(null);
  readonly busy = input(false);
  readonly saved = output<T>();
  /** How many fields still need fixing after a refused save; 0 once a save goes out. */
  readonly invalidCount = output<number>();
  /** True while a file uploads: saving then would store the previous file. */
  readonly uploadingChange = output<boolean>();

  protected readonly t = inject(I18nService).t;
  protected readonly text = inject(ContentStore).text;
  protected readonly fb = inject(NonNullableFormBuilder);
  protected readonly formId = ADMIN_FORM_ID;
  protected readonly locales = LOCALES;
  protected readonly statusOptions = computed<DropdownOption[]>(() => [
    { value: 'draft' satisfies PublicationStatus, label: this.t('admin.draft') },
    { value: 'published' satisfies PublicationStatus, label: this.t('admin.published') },
  ]);
  /** A new record keeps one id however many times its save is retried. */
  protected readonly newId = crypto.randomUUID();
  /** Set by the first save attempt: from then on every problem shows. */
  protected readonly submitted = signal(false);
  private readonly uploading = signal(false);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  protected abstract readonly form: FormGroup;

  /** Copies a stored record into the form. */
  protected abstract patch(record: T): void;

  /** The record the form now describes, trimmed and ready to store. */
  protected abstract toRecord(): T;

  ngOnInit(): void {
    const record = this.record();
    if (record) this.patch(record);
    // After a refused save, the dialog's count follows each fix as it is made.
    this.form.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.submitted()) this.invalidCount.emit(countInvalid(this.form));
    });
  }

  protected submit(): void {
    if (this.busy() || this.uploading()) return;
    this.prepare();
    this.submitted.set(true);
    this.form.markAllAsTouched();
    const invalid = countInvalid(this.form);
    this.invalidCount.emit(invalid);
    if (invalid) {
      // The messages render first; only then is there an invalid field to move to.
      afterNextRender(
        () => this.host.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        { injector: this.injector },
      );
      return;
    }
    this.saved.emit(this.toRecord());
  }

  /** Fills in what the form can derive itself, like a slug from a name, just before the check. */
  protected prepare(): void {
    // Most sections have nothing to derive.
  }

  protected setUploading(uploading: boolean): void {
    this.uploading.set(uploading);
    this.uploadingChange.emit(uploading);
  }

  protected errorFor(control: AbstractControl): string {
    const errors = control.errors;
    if (!errors || !(this.submitted() || (control.dirty && control.touched))) return '';
    return errorMessage(errors, this.t);
  }
}
