import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import { I18nService } from '../../core/i18n/i18n.service';
import { ButtonComponent } from './button.component';
import { joinIds } from './form-field.component';
import { IconComponent } from './icon.component';

/** Stores a file and resolves to its public URL. Supplied by a `core/api` service. */
export type ImageUploader = (file: File) => Promise<string>;

export const IMAGE_TYPES: readonly string[] = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
];

type UploadError = 'type' | 'size' | 'failed';

let nextImageUploadId = 0;

/**
 * An image field: drop or browse for a file, see it, replace or remove it. The
 * value is the image URL, '' for none.
 *
 * The file's type and size are checked first, a local preview shows at once, and
 * the file goes to `upload` — the component itself makes no request. On failure
 * the previous image stays and the error is announced. `uploadingChange` lets a
 * form hold its submit until the upload lands. There is deliberately no URL field:
 * an image is always a file stored through `upload`.
 */
@Component({
  selector: 'app-image-upload',
  imports: [ButtonComponent, IconComponent],
  template: `
    <div class="upload" role="group" [attr.aria-labelledby]="labelId">
      <span class="upload-label" [id]="labelId">{{ label() }}</span>
      <div
        class="upload-surface"
        [class.is-dragging]="dragging()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        @if (preview()) {
          <div class="upload-preview">
            <span class="upload-thumb" [class.is-uploading]="uploading()">
              @if (broken()) {
                <app-icon name="image" class="upload-thumb-icon" />
              } @else {
                <img
                  class="upload-image"
                  [src]="preview()"
                  [alt]="t('controls.upload.preview', { label: label() })"
                  (error)="broken.set(true)"
                />
              }
              @if (uploading()) {
                <span class="upload-spinner" aria-hidden="true"></span>
              }
            </span>
            <div class="upload-actions">
              <button
                appButton="secondary"
                size="sm"
                type="button"
                [disabled]="isDisabled() || uploading()"
                [attr.aria-describedby]="describedBy()"
                (click)="browse()"
              >
                <app-icon name="upload" class="upload-action-icon" />
                {{ t('controls.upload.replace') }}
              </button>
              <button
                appButton="danger-ghost"
                size="sm"
                type="button"
                [disabled]="isDisabled() || uploading()"
                (click)="remove()"
              >
                <app-icon name="trash" class="upload-action-icon" />
                {{ t('controls.upload.remove') }}
              </button>
            </div>
          </div>
        } @else {
          <button
            type="button"
            class="upload-zone"
            [disabled]="isDisabled() || uploading()"
            [attr.aria-describedby]="describedBy()"
            (click)="browse()"
          >
            <span class="upload-zone-icon"
              ><app-icon name="upload" class="upload-zone-glyph"
            /></span>
            <span>{{ t('controls.upload.drop') }}</span>
          </button>
        }
      </div>
      <input
        #file
        type="file"
        hidden
        [accept]="acceptAttribute()"
        (change)="onFileSelected(file)"
      />
      <p class="upload-hint" [id]="hintId">
        {{ t('controls.upload.hint', { size: maxSizeMb() }) }}
      </p>
      @if (errorMessage()) {
        <p class="upload-error" role="alert" [id]="errorId">
          <app-icon name="alert" class="upload-error-icon" />{{ errorMessage() }}
        </p>
      }
      <span class="sr-only" aria-live="polite">{{ status() }}</span>
    </div>
  `,
  styleUrl: './image-upload.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImageUploadComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadComponent implements ControlValueAccessor {
  protected readonly t = inject(I18nService).t;
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('file');
  private readonly id = `app-image-upload-${nextImageUploadId++}`;
  protected readonly labelId = `${this.id}-label`;
  protected readonly hintId = `${this.id}-hint`;
  protected readonly errorId = `${this.id}-error`;

  readonly label = input.required<string>();
  readonly upload = input.required<ImageUploader>();
  readonly accept = input<readonly string[]>(IMAGE_TYPES);
  /** The largest accepted file, in megabytes. */
  readonly maxSizeMb = input(5);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model('');
  readonly uploadingChange = output<boolean>();

  protected readonly uploading = signal(false);
  protected readonly dragging = signal(false);
  protected readonly broken = signal(false);
  protected readonly status = signal('');
  private readonly error = signal<UploadError | null>(null);
  private readonly localPreview = signal<string | null>(null);
  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly preview = computed(() => this.localPreview() ?? this.value());
  protected readonly acceptAttribute = computed(() => this.accept().join(','));
  protected readonly describedBy = computed(() =>
    joinIds(this.hintId, this.error() ? this.errorId : null),
  );
  protected readonly errorMessage = computed(() => {
    switch (this.error()) {
      case 'type':
        return this.t('controls.upload.errorType');
      case 'size':
        return this.t('controls.upload.errorSize', { size: this.maxSizeMb() });
      case 'failed':
        return this.t('controls.upload.errorFailed');
      default:
        return '';
    }
  });

  private onChange: (value: string) => void = () => undefined;
  protected markTouched: () => void = () => undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revokePreview());
  }

  writeValue(value: string | null | undefined): void {
    this.broken.set(false);
    this.value.set(value ?? '');
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.markTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  protected browse(): void {
    if (!this.isDisabled() && !this.uploading()) {
      this.fileInput().nativeElement.click();
    }
  }

  protected onFileSelected(element: HTMLInputElement): void {
    const file = element.files?.[0];
    // Cleared so that choosing the same file again still fires `change`.
    element.value = '';
    if (file) {
      void this.handle(file);
    }
  }

  protected onDragOver(event: DragEvent): void {
    if (this.isDisabled() || this.uploading()) {
      return;
    }
    // Cancelling dragover is what makes the surface a drop target.
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    this.dragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    // Moving onto a child of the surface is not leaving it.
    const next = event.relatedTarget;
    const surface = event.currentTarget;
    if (!(next instanceof Node && surface instanceof Node && surface.contains(next))) {
      this.dragging.set(false);
    }
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file && !this.isDisabled() && !this.uploading()) {
      void this.handle(file);
    }
  }

  protected remove(): void {
    if (this.isDisabled() || this.uploading()) {
      return;
    }
    this.error.set(null);
    this.status.set('');
    this.commit('');
  }

  private async handle(file: File): Promise<void> {
    this.markTouched();
    this.status.set('');
    if (!this.accept().includes(file.type)) {
      this.error.set('type');
      return;
    }
    if (file.size > this.maxSizeMb() * 1024 * 1024) {
      this.error.set('size');
      return;
    }
    this.error.set(null);
    this.broken.set(false);
    this.revokePreview();
    // jsdom and some embedded browsers have no object URLs; the preview then
    // simply waits for the uploaded URL.
    if (typeof URL.createObjectURL === 'function') {
      this.localPreview.set(URL.createObjectURL(file));
    }
    this.setUploading(true);
    this.status.set(this.t('controls.upload.uploading'));
    try {
      const url = await this.upload()(file);
      this.commit(url);
      this.status.set(this.t('controls.upload.done'));
    } catch {
      this.error.set('failed');
      this.status.set('');
    } finally {
      this.revokePreview();
      this.setUploading(false);
    }
  }

  private commit(value: string): void {
    this.broken.set(false);
    this.value.set(value);
    this.onChange(value);
  }

  private setUploading(uploading: boolean): void {
    this.uploading.set(uploading);
    this.uploadingChange.emit(uploading);
  }

  private revokePreview(): void {
    const preview = this.localPreview();
    if (preview) {
      URL.revokeObjectURL(preview);
      this.localPreview.set(null);
    }
  }
}
