import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import type { PublicationStatus, SocialLink } from '../../../core/models/content.model';
import { DropdownListComponent } from '../../../shared/ui/dropdown-list.component';
import { FormFieldComponent } from '../../../shared/ui/form-field.component';
import { InputDirective } from '../../../shared/ui/input.directive';
import { NumberInputComponent } from '../../../shared/ui/number-input.component';
import { AdminForm, filled, webLink, wholeNumber } from './admin-form';
import { IconFieldComponent } from './icon-field.component';

/**
 * A profile in the footer: the platform's name, the page it opens and its icon.
 * Only web pages belong here — an email address goes under Contact details.
 */
@Component({
  selector: 'app-social-form',
  imports: [
    ReactiveFormsModule,
    DropdownListComponent,
    FormFieldComponent,
    IconFieldComponent,
    InputDirective,
    NumberInputComponent,
  ],
  templateUrl: './social-form.component.html',
  styleUrl: './admin-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialFormComponent extends AdminForm<SocialLink> {
  protected readonly form = this.fb.group({
    name: ['', [filled, Validators.maxLength(160)]],
    url: ['', [filled, webLink]],
    icon_url: [''],
    position: [0, wholeNumber(0, 9999)],
    status: this.fb.control<PublicationStatus>('draft'),
  });
  /** What the website shows until an icon is uploaded. */
  protected readonly glyph = computed(() => this.record()?.icon ?? 'globe');

  protected patch(record: SocialLink): void {
    this.form.patchValue(record);
  }

  protected toRecord(): SocialLink {
    const raw = this.form.getRawValue();
    return {
      id: this.record()?.id ?? this.newId,
      name: raw.name.trim(),
      url: raw.url.trim(),
      icon: this.glyph(),
      icon_url: raw.icon_url,
      status: raw.status,
      position: raw.position,
    };
  }
}
