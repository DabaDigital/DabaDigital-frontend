import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import { ContentApi } from '../../../core/api/content.api';
import type { ManagedTeamMember, PublicationStatus } from '../../../core/models/content.model';
import { DropdownListComponent } from '../../../shared/ui/dropdown-list.component';
import { FormFieldComponent } from '../../../shared/ui/form-field.component';
import {
  ImageUploadComponent,
  type ImageUploader,
} from '../../../shared/ui/image-upload.component';
import { InputDirective } from '../../../shared/ui/input.directive';
import { NumberInputComponent } from '../../../shared/ui/number-input.component';
import { AdminForm, filled, localizedGroup, trimmed, webLink, wholeNumber } from './admin-form';

/**
 * A person in the Team section: their name, their role and a few words about
 * them in three languages, the portfolio their card links to, and a portrait.
 */
@Component({
  selector: 'app-team-form',
  imports: [
    ReactiveFormsModule,
    DropdownListComponent,
    FormFieldComponent,
    ImageUploadComponent,
    InputDirective,
    NumberInputComponent,
  ],
  templateUrl: './team-form.component.html',
  styleUrl: './admin-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamFormComponent extends AdminForm<ManagedTeamMember> {
  private readonly api = inject(ContentApi);
  protected readonly uploadPhoto: ImageUploader = (file) => this.api.uploadMedia(file, 'team');
  protected readonly form = this.fb.group({
    name: ['', [filled, Validators.maxLength(160)]],
    role: localizedGroup(this.fb, 160, { required: true }),
    description: localizedGroup(this.fb, 1000, { required: true }),
    url: ['', webLink],
    photo_url: [''],
    position: [0, wholeNumber(0, 9999)],
    status: this.fb.control<PublicationStatus>('draft'),
  });

  protected patch(record: ManagedTeamMember): void {
    this.form.patchValue(record);
  }

  protected toRecord(): ManagedTeamMember {
    const raw = this.form.getRawValue();
    return {
      id: this.record()?.id ?? this.newId,
      name: raw.name.trim(),
      role: trimmed(raw.role),
      description: trimmed(raw.description),
      url: raw.url.trim(),
      photo_url: raw.photo_url,
      status: raw.status,
      position: raw.position,
    };
  }
}
