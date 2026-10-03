import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ReactiveFormsModule, type FormControl } from '@angular/forms';

import { ContentApi } from '../../../core/api/content.api';
import { I18nService } from '../../../core/i18n/i18n.service';
import { IconComponent, type IconName } from '../../../shared/ui/icon.component';
import {
  ImageUploadComponent,
  type ImageUploader,
} from '../../../shared/ui/image-upload.component';

/**
 * An uploaded icon for a service, a social link or a contact channel. Until one
 * is uploaded the website keeps showing the record's built-in glyph, so the
 * field shows that glyph too: whoever edits sees what visitors see.
 */
@Component({
  selector: 'app-icon-field',
  imports: [ReactiveFormsModule, IconComponent, ImageUploadComponent],
  template: `
    <app-image-upload
      variant="icon"
      [formControl]="control()"
      [label]="t('admin.icon')"
      [upload]="upload"
      [maxSizeMb]="maxSizeMb"
      [hint]="t('admin.iconHint', { size: maxSizeMb })"
      [typeError]="t('admin.iconTypeError')"
      (uploadingChange)="uploadingChange.emit($event)"
    >
      <p appUploadEmpty class="fallback">
        <span class="fallback__glyph"><app-icon [name]="fallback()" /></span>
        {{ t('admin.iconFallback') }}
      </p>
    </app-image-upload>
  `,
  styles: `
    :host {
      display: block;
    }
    .fallback {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      margin: 0;
      color: var(--text-muted);
      font-size: 0.8125rem;
    }
    .fallback__glyph {
      display: grid;
      flex: none;
      inline-size: 2rem;
      block-size: 2rem;
      place-items: center;
      border-radius: var(--radius-sm);
      background-color: var(--primary-soft);
      color: var(--primary);
    }
    .fallback__glyph app-icon {
      inline-size: 1rem;
      block-size: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconFieldComponent {
  readonly control = input.required<FormControl<string>>();
  /** The built-in glyph the website shows while no icon is uploaded. */
  readonly fallback = input.required<IconName>();
  readonly uploadingChange = output<boolean>();

  protected readonly t = inject(I18nService).t;
  private readonly api = inject(ContentApi);
  /** An icon is small: a larger file is almost always a photo or an unoptimized export. */
  protected readonly maxSizeMb = 1;
  protected readonly upload: ImageUploader = (file) => this.api.uploadMedia(file, 'icons');
}
