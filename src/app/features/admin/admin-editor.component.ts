import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';
import type {
  Category,
  ContentRecord,
  ContentSection,
  SectionEntry,
} from '../../core/models/content.model';
import { ButtonComponent } from '../../shared/ui/button.component';
import { DialogComponent } from '../../shared/ui/dialog.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { ADMIN_FORM_ID } from './forms/admin-form';
import { CategoryFormComponent } from './forms/category-form.component';
import { ContactFormComponent } from './forms/contact-form.component';
import { ProjectFormComponent } from './forms/project-form.component';
import { ServiceFormComponent } from './forms/service-form.component';
import { SocialFormComponent } from './forms/social-form.component';
import { TeamFormComponent } from './forms/team-form.component';

/**
 * The dialog around one section's form. Every section has a form of its own —
 * its fields, its rules, its messages — under `./forms`; this only frames the
 * one that is open: the heading, Cancel and Save, and the line beside them that
 * says what stopped a save, in view however far down the form has scrolled.
 */
@Component({
  selector: 'app-admin-editor',
  imports: [
    ButtonComponent,
    DialogComponent,
    IconComponent,
    CategoryFormComponent,
    ContactFormComponent,
    ProjectFormComponent,
    ServiceFormComponent,
    SocialFormComponent,
    TeamFormComponent,
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
  /** Why the last save failed, already translated. */
  readonly error = input('');
  readonly saved = output<ContentRecord>();
  readonly closed = output<void>();
  protected readonly t = inject(I18nService).t;
  protected readonly formId = ADMIN_FORM_ID;
  /** A file upload in flight: saving now would store the previous file. */
  protected readonly uploading = signal(false);
  /** Fields left to fix after a refused save. */
  protected readonly invalidCount = signal(0);
  /** The page opens a section's editor only on a row of that same section, so the pair matches. */
  protected readonly entry = computed(
    () => ({ section: this.section(), record: this.record() }) as SectionEntry,
  );
}
