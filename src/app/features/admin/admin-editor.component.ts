import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContentApi } from '../../core/api/content.api';
import { ContentStore } from '../../core/content.store';
import { I18nService } from '../../core/i18n/i18n.service';
import type {
  Category,
  ContentRecord,
  ContentSection,
  LocalizedText,
  PublicationStatus,
} from '../../core/models/content.model';
import { ButtonComponent } from '../../shared/ui/button.component';
import { DatePickerComponent } from '../../shared/ui/date-picker.component';
import { DialogComponent } from '../../shared/ui/dialog.component';
import {
  DropdownListComponent,
  type DropdownOption,
} from '../../shared/ui/dropdown-list.component';
import { FormFieldComponent } from '../../shared/ui/form-field.component';
import type { IconName } from '../../shared/ui/icon.component';
import { ImageUploadComponent, type ImageUploader } from '../../shared/ui/image-upload.component';
import { InputDirective } from '../../shared/ui/input.directive';
import { MultiSelectComponent } from '../../shared/ui/multi-select.component';
import { NumberInputComponent } from '../../shared/ui/number-input.component';

export function validLink(value: string, contact = false): boolean {
  if (!value) return true;
  if (contact && /^(mailto:[^\s@]+@[^\s@]+\.[^\s@]+|tel:\+?[\d\s()-]+)$/.test(value)) return true;
  try {
    return ['https:', 'http:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** The glyphs an editor may pick for a service, social link or contact channel. */
const ICONS = [
  'code',
  'bag',
  'sparkles',
  'mobile',
  'palette',
  'cloud',
  'globe',
  'linkedin',
  'instagram',
  'mail',
  'phone',
  'map-pin',
  'clock',
  'shield',
] as const satisfies readonly IconName[];

@Component({
  selector: 'app-admin-editor',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    DatePickerComponent,
    DialogComponent,
    DropdownListComponent,
    FormFieldComponent,
    ImageUploadComponent,
    InputDirective,
    MultiSelectComponent,
    NumberInputComponent,
  ],
  templateUrl: './admin-editor.component.html',
  styleUrl: './admin-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEditorComponent {
  readonly section = input.required<ContentSection>();
  readonly record = input<ContentRecord | null>(null);
  readonly categories = input<Category[]>([]);
  readonly busy = input(false);
  readonly error = input('');
  readonly saved = output<ContentRecord>();
  readonly closed = output<void>();
  protected readonly t = inject(I18nService).t;
  protected readonly text = inject(ContentStore).text;
  private readonly api = inject(ContentApi);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly formId = 'admin-editor-form';
  protected readonly locales = [
    { id: 'en', label: 'English' },
    { id: 'fr', label: 'Français' },
    { id: 'ar', label: 'العربية' },
  ] as const;
  protected readonly minYear = '1990';
  protected readonly maxYear = String(new Date().getFullYear() + 1);
  protected readonly invalid = signal(false);
  /** A cover upload in flight: saving now would store the previous image. */
  protected readonly uploading = signal(false);
  protected readonly uploadImage: ImageUploader = (file) => this.api.uploadProjectImage(file);
  protected readonly categoryOptions = computed(() =>
    this.categories().map((category) => ({ value: category.id, label: this.text(category.name) })),
  );
  protected readonly iconOptions = computed<DropdownOption[]>(() =>
    ICONS.map((icon) => ({ value: icon, label: this.t(`admin.icons.${icon}`), icon })),
  );
  protected readonly toneOptions = computed<DropdownOption[]>(() => [
    { value: 'primary', label: this.t('admin.blue') },
    { value: 'accent', label: this.t('admin.terracotta') },
  ]);
  protected readonly statusOptions = computed<DropdownOption[]>(() => [
    { value: 'draft', label: this.t('admin.draft') },
    { value: 'published', label: this.t('admin.published') },
  ]);
  private readonly newId = crypto.randomUUID();
  protected readonly form = this.fb.group({
    name: [''],
    slug: [''],
    year: [String(new Date().getFullYear())],
    title: this.localized(),
    description: this.localized(),
    summary: this.localized(),
    label: this.localized(),
    value: this.localized(),
    categories: this.fb.control<string[]>([]),
    image_url: [''],
    website_url: [''],
    url: [''],
    href: [''],
    icon: this.fb.control<IconName>('code'),
    tone: this.fb.control<'primary' | 'accent'>('primary'),
    status: this.fb.control<PublicationStatus>('draft'),
    position: [0, [Validators.min(0), Validators.max(9999)]],
  });

  constructor() {
    effect(() => {
      const record = this.record();
      if (!record) return;
      if ('name' in record && 'slug' in record && typeof record.name !== 'string') {
        this.form.patchValue({ title: record.name, slug: record.slug, position: record.position });
      } else {
        this.form.patchValue(record as Exclude<ContentRecord, Category>);
      }
    });
  }

  private localized() {
    return this.fb.group({ en: [''], fr: [''], ar: [''] });
  }
  protected sectionTitle(): string {
    return this.t(`admin.${this.section()}`);
  }

  protected suggestSlug(): void {
    if (this.record() || this.form.controls.slug.value) return;
    const value =
      this.section() === 'categories'
        ? this.form.controls.title.controls.en.value
        : this.form.controls.name.value;
    this.form.controls.slug.setValue(
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    );
  }

  protected submit(): void {
    if (this.busy() || this.uploading()) return;
    this.suggestSlug();
    const raw = this.form.getRawValue();
    const localized = (value: LocalizedText): LocalizedText => ({
      en: value.en.trim(),
      fr: value.fr.trim(),
      ar: value.ar.trim(),
    });
    const section = this.section();
    const slugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw.slug);
    const required =
      section === 'projects'
        ? raw.name.trim() && raw.summary.en.trim() && slugValid && /^\d{4}$/.test(raw.year)
        : section === 'categories'
          ? raw.title.en.trim() && slugValid
          : section === 'services'
            ? raw.title.en.trim() && raw.description.en.trim()
            : section === 'social'
              ? raw.name.trim() && raw.url.trim()
              : raw.label.en.trim() && raw.value.en.trim();
    this.invalid.set(
      !required ||
        this.form.invalid ||
        // The stepper reports an emptied field as null, whatever the control's type says.
        !Number.isInteger(raw.position) ||
        !validLink(raw.image_url) ||
        !validLink(raw.website_url) ||
        !validLink(raw.url) ||
        !validLink(raw.href, true),
    );
    if (this.invalid()) return;
    const base = {
      id: this.record()?.id ?? this.newId,
      position: raw.position,
      status: raw.status,
    };
    let record: ContentRecord;
    switch (section) {
      case 'projects':
        record = {
          ...base,
          name: raw.name.trim(),
          slug: raw.slug,
          year: raw.year,
          summary: localized(raw.summary),
          description: localized(raw.description),
          categories: raw.categories,
          tone: raw.tone,
          image_url: raw.image_url.trim(),
          website_url: raw.website_url.trim(),
        };
        break;
      case 'categories':
        record = {
          id: base.id,
          position: base.position,
          name: localized(raw.title),
          slug: raw.slug,
        };
        break;
      case 'services':
        record = {
          ...base,
          title: localized(raw.title),
          description: localized(raw.description),
          icon: raw.icon,
        };
        break;
      case 'social':
        record = { ...base, name: raw.name.trim(), url: raw.url.trim(), icon: raw.icon };
        break;
      case 'contact':
        record = {
          ...base,
          label: localized(raw.label),
          value: localized(raw.value),
          href: raw.href.trim(),
          icon: raw.icon,
        };
        break;
    }
    this.saved.emit(record);
  }
}
