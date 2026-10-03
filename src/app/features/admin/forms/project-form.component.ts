import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import { ContentApi } from '../../../core/api/content.api';
import type {
  Category,
  ManagedProject,
  PublicationStatus,
} from '../../../core/models/content.model';
import { DatePickerComponent } from '../../../shared/ui/date-picker.component';
import {
  DropdownListComponent,
  type DropdownOption,
} from '../../../shared/ui/dropdown-list.component';
import { FormFieldComponent } from '../../../shared/ui/form-field.component';
import {
  ImageUploadComponent,
  type ImageUploader,
} from '../../../shared/ui/image-upload.component';
import { InputDirective } from '../../../shared/ui/input.directive';
import { MultiSelectComponent } from '../../../shared/ui/multi-select.component';
import { NumberInputComponent } from '../../../shared/ui/number-input.component';
import {
  AdminForm,
  filled,
  localizedGroup,
  slugFormat,
  slugify,
  trimmed,
  webLink,
  wholeNumber,
  yearFormat,
} from './admin-form';

/** A portfolio project: its name and address, its story in three languages, and its cover. */
@Component({
  selector: 'app-project-form',
  imports: [
    ReactiveFormsModule,
    DatePickerComponent,
    DropdownListComponent,
    FormFieldComponent,
    ImageUploadComponent,
    InputDirective,
    MultiSelectComponent,
    NumberInputComponent,
  ],
  templateUrl: './project-form.component.html',
  styleUrl: './admin-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFormComponent extends AdminForm<ManagedProject> {
  readonly categories = input<Category[]>([]);
  private readonly api = inject(ContentApi);
  protected readonly minYear = '1990';
  protected readonly maxYear = String(new Date().getFullYear() + 1);
  protected readonly uploadImage: ImageUploader = (file) => this.api.uploadProjectImage(file);
  protected readonly categoryOptions = computed(() =>
    this.categories().map((category) => ({ value: category.id, label: this.text(category.name) })),
  );
  protected readonly toneOptions = computed<DropdownOption[]>(() => [
    { value: 'primary', label: this.t('admin.blue') },
    { value: 'accent', label: this.t('admin.terracotta') },
  ]);
  protected readonly form = this.fb.group({
    name: ['', [filled, Validators.maxLength(160)]],
    slug: ['', [filled, slugFormat, Validators.maxLength(160)]],
    summary: localizedGroup(this.fb, 500, { required: true }),
    description: localizedGroup(this.fb, 10000),
    categories: this.fb.control<string[]>([]),
    year: [String(new Date().getFullYear()), yearFormat],
    tone: this.fb.control<ManagedProject['tone']>('primary'),
    image_url: [''],
    website_url: ['', webLink],
    position: [0, wholeNumber(0, 9999)],
    status: this.fb.control<PublicationStatus>('draft'),
  });

  protected patch(record: ManagedProject): void {
    this.form.patchValue(record);
  }

  protected override prepare(): void {
    this.suggestSlug();
  }

  /** A new project's slug follows its name, until someone types a slug of their own. */
  protected suggestSlug(): void {
    const slug = this.form.controls.slug;
    if (this.record() || slug.value.trim()) return;
    slug.setValue(slugify(this.form.controls.name.value));
  }

  protected toRecord(): ManagedProject {
    const raw = this.form.getRawValue();
    return {
      id: this.record()?.id ?? this.newId,
      name: raw.name.trim(),
      slug: raw.slug.trim(),
      year: raw.year,
      summary: trimmed(raw.summary),
      description: trimmed(raw.description),
      categories: raw.categories,
      tone: raw.tone,
      image_url: raw.image_url.trim(),
      website_url: raw.website_url.trim(),
      status: raw.status,
      position: raw.position,
    };
  }
}
