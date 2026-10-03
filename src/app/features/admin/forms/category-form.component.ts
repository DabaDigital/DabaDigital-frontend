import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import type { Category } from '../../../core/models/content.model';
import { FormFieldComponent } from '../../../shared/ui/form-field.component';
import { InputDirective } from '../../../shared/ui/input.directive';
import { NumberInputComponent } from '../../../shared/ui/number-input.component';
import {
  AdminForm,
  filled,
  localizedGroup,
  slugFormat,
  slugify,
  trimmed,
  wholeNumber,
} from './admin-form';

/** A portfolio filter: a translated title and the slug it is linked by. It is never a draft. */
@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule, FormFieldComponent, InputDirective, NumberInputComponent],
  templateUrl: './category-form.component.html',
  styleUrl: './admin-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormComponent extends AdminForm<Category> {
  protected readonly form = this.fb.group({
    title: localizedGroup(this.fb, 160, { required: true }),
    slug: ['', [filled, slugFormat, Validators.maxLength(160)]],
    position: [0, wholeNumber(0, 9999)],
  });

  /** The table calls a category's text its name; the form shows it as a title, like the others. */
  protected patch(record: Category): void {
    this.form.patchValue({ title: record.name, slug: record.slug, position: record.position });
  }

  protected override prepare(): void {
    this.suggestSlug();
  }

  /** A new category's slug follows its English title, until someone types a slug of their own. */
  protected suggestSlug(): void {
    const slug = this.form.controls.slug;
    if (this.record() || slug.value.trim()) return;
    slug.setValue(slugify(this.form.controls.title.controls.en.value));
  }

  protected toRecord(): Category {
    const raw = this.form.getRawValue();
    return {
      id: this.record()?.id ?? this.newId,
      name: trimmed(raw.title),
      slug: raw.slug.trim(),
      position: raw.position,
    };
  }
}
