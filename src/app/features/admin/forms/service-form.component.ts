import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import type { ManagedService, PublicationStatus } from '../../../core/models/content.model';
import { DropdownListComponent } from '../../../shared/ui/dropdown-list.component';
import { FormFieldComponent } from '../../../shared/ui/form-field.component';
import { InputDirective } from '../../../shared/ui/input.directive';
import { NumberInputComponent } from '../../../shared/ui/number-input.component';
import { AdminForm, localizedGroup, trimmed, wholeNumber } from './admin-form';
import { IconFieldComponent } from './icon-field.component';

/** A service card: a title and a description in three languages, and an uploaded icon. */
@Component({
  selector: 'app-service-form',
  imports: [
    ReactiveFormsModule,
    DropdownListComponent,
    FormFieldComponent,
    IconFieldComponent,
    InputDirective,
    NumberInputComponent,
  ],
  templateUrl: './service-form.component.html',
  styleUrl: './admin-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceFormComponent extends AdminForm<ManagedService> {
  protected readonly form = this.fb.group({
    title: localizedGroup(this.fb, 160, { required: true }),
    description: localizedGroup(this.fb, 10000, { required: true }),
    icon_url: [''],
    position: [0, wholeNumber(0, 9999)],
    status: this.fb.control<PublicationStatus>('draft'),
  });
  /** What the website shows until an icon is uploaded. */
  protected readonly glyph = computed(() => this.record()?.icon ?? 'code');

  protected patch(record: ManagedService): void {
    this.form.patchValue(record);
  }

  protected toRecord(): ManagedService {
    const raw = this.form.getRawValue();
    return {
      id: this.record()?.id ?? this.newId,
      title: trimmed(raw.title),
      description: trimmed(raw.description),
      icon: this.glyph(),
      icon_url: raw.icon_url,
      status: raw.status,
      position: raw.position,
    };
  }
}
