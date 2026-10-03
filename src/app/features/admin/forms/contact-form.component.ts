import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';

import type { ContactChannel, PublicationStatus } from '../../../core/models/content.model';
import { DropdownListComponent } from '../../../shared/ui/dropdown-list.component';
import { FormFieldComponent } from '../../../shared/ui/form-field.component';
import type { IconName } from '../../../shared/ui/icon.component';
import { InputDirective } from '../../../shared/ui/input.directive';
import { NumberInputComponent } from '../../../shared/ui/number-input.component';
import {
  AdminForm,
  contactLink,
  linkFor,
  localizedGroup,
  readableText,
  trimmed,
  wholeNumber,
} from './admin-form';
import { IconFieldComponent } from './icon-field.component';

/** The glyph a new channel falls back to, read from where its link leads. */
function glyphFor(href: string): IconName {
  if (href.startsWith('mailto:')) return 'mail';
  if (href.startsWith('tel:')) return 'phone';
  return href ? 'globe' : 'map-pin';
}

/**
 * A way to reach the studio. The value is the text visitors read
 * (contact@dabadigital.ma); the link is what opens when they click it
 * (mailto:contact@dabadigital.ma), and is filled in from an email address or
 * a phone number typed as the value.
 */
@Component({
  selector: 'app-contact-form',
  imports: [
    ReactiveFormsModule,
    DropdownListComponent,
    FormFieldComponent,
    IconFieldComponent,
    InputDirective,
    NumberInputComponent,
  ],
  templateUrl: './contact-form.component.html',
  styleUrl: './admin-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactFormComponent extends AdminForm<ContactChannel> {
  protected readonly form = this.fb.group({
    label: localizedGroup(this.fb, 160, { required: true }),
    value: localizedGroup(this.fb, 500, { required: true, validators: [readableText] }),
    href: ['', contactLink],
    icon_url: [''],
    position: [0, wholeNumber(0, 9999)],
    status: this.fb.control<PublicationStatus>('draft'),
  });
  private readonly href = toSignal(this.form.controls.href.valueChanges, { initialValue: '' });
  /** What the website shows until an icon is uploaded. */
  protected readonly glyph = computed(() => this.record()?.icon ?? glyphFor(this.href().trim()));

  protected patch(record: ContactChannel): void {
    this.form.patchValue(record);
  }

  /** An email address or a phone number typed as the value brings its link, unless one is set. */
  protected suggestLink(): void {
    const href = this.form.controls.href;
    if (href.value.trim()) return;
    href.setValue(linkFor(this.form.controls.value.controls.en.value));
  }

  protected toRecord(): ContactChannel {
    const raw = this.form.getRawValue();
    return {
      id: this.record()?.id ?? this.newId,
      label: trimmed(raw.label),
      value: trimmed(raw.value),
      href: raw.href.trim(),
      icon: this.glyph(),
      icon_url: raw.icon_url,
      status: raw.status,
      position: raw.position,
    };
  }
}
