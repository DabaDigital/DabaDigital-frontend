import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nService } from '../../core/i18n/i18n.service';
import { ImageUploadComponent, type ImageUploader } from './image-upload.component';

@Component({
  selector: 'app-image-upload-test-host',
  imports: [ReactiveFormsModule, ImageUploadComponent],
  template: `
    <app-image-upload
      label="Cover image"
      [formControl]="image"
      [upload]="upload"
      (uploadingChange)="uploading.push($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ImageUploadHost {
  readonly image = new FormControl('');
  readonly uploading: boolean[] = [];
  readonly files: File[] = [];
  settle: { resolve: (url: string) => void; reject: (error: unknown) => void } | null = null;
  readonly upload: ImageUploader = (file) => {
    this.files.push(file);
    return new Promise((resolve, reject) => (this.settle = { resolve, reject }));
  };
}

const png = (bytes = 8): File =>
  new File([new Uint8Array(bytes)], 'cover.png', { type: 'image/png' });

describe('ImageUploadComponent', () => {
  let fixture: ComponentFixture<ImageUploadHost>;
  let form: ImageUploadHost;
  let host: HTMLElement;

  function find<T extends Element = HTMLElement>(selector: string): T {
    const found = host.querySelector<T>(selector);
    if (!found) throw new Error(`Missing element in test: ${selector}`);
    return found;
  }
  function button(name: string): HTMLButtonElement {
    const match = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes(name));
    if (!match) throw new Error(`Missing button: ${name}`);
    return match;
  }
  function choose(file: File): void {
    const input = find<HTMLInputElement>('input[type="file"]');
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }
  async function settled(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ImageUploadHost] }).compileComponents();
    TestBed.inject(I18nService).setLocale('en');
    fixture = TestBed.createComponent(ImageUploadHost);
    form = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('labels the group and offers a drop zone with the accepted types', () => {
    const group = find('[role="group"]');
    const label = find(`#${group.getAttribute('aria-labelledby')}`);
    expect(label.textContent).toBe('Cover image');
    expect(button('Drag an image here').getAttribute('aria-describedby')).toContain('hint');
    expect(find('input[type="file"]').getAttribute('accept')).toContain('image/webp');
    expect(host.textContent).toContain('up to 5 MB');
  });

  afterEach(() => vi.unstubAllGlobals());

  it('uploads a chosen image, reports progress and stores the returned URL', async () => {
    // jsdom has no object URLs; stand them in so the instant local preview is exercised.
    const revoke = vi.fn();
    vi.stubGlobal(
      'URL',
      Object.assign(class extends URL {}, {
        createObjectURL: () => 'blob:preview',
        revokeObjectURL: revoke,
      }),
    );
    choose(png());
    expect(form.files).toHaveLength(1);
    expect(form.uploading).toEqual([true]);
    expect(find<HTMLImageElement>('img').getAttribute('src')).toBe('blob:preview');
    expect(button('Replace').disabled).toBe(true);
    expect(find('[aria-live="polite"]').textContent).toContain('Uploading…');
    expect(form.image.value).toBe('');

    form.settle?.resolve('https://cdn.example/projects/cover.png');
    await settled();
    expect(revoke).toHaveBeenCalledWith('blob:preview');
    expect(form.image.value).toBe('https://cdn.example/projects/cover.png');
    expect(form.image.dirty).toBe(true);
    expect(form.uploading).toEqual([true, false]);
    expect(find<HTMLImageElement>('img').getAttribute('src')).toBe(
      'https://cdn.example/projects/cover.png',
    );
    expect(find<HTMLImageElement>('img').alt).toBe('Preview: Cover image');
    expect(find('[aria-live="polite"]').textContent).toContain('Image uploaded.');
  });

  it('refuses files that are not supported images or too large, without uploading', () => {
    choose(new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' }));
    expect(find('[role="alert"]').textContent).toContain('Choose an image file');

    choose(png(5 * 1024 * 1024 + 1));
    expect(find('[role="alert"]').textContent).toContain('larger than 5 MB');
    expect(form.files).toHaveLength(0);
    expect(form.image.value).toBe('');
  });

  it('keeps the previous image when the upload fails', async () => {
    form.image.setValue('https://cdn.example/old.png');
    fixture.detectChanges();
    choose(png());
    form.settle?.reject(new Error('offline'));
    await settled();

    expect(form.image.value).toBe('https://cdn.example/old.png');
    expect(find('[role="alert"]').textContent).toContain('The upload failed');
    expect(find<HTMLImageElement>('img').getAttribute('src')).toBe('https://cdn.example/old.png');
    expect(button('Replace').disabled).toBe(false);
  });

  it('removes the image and offers only a file, never a URL field', () => {
    expect(host.querySelector('input[type="url"]')).toBeNull();
    form.image.setValue('https://cdn.example/old.png');
    fixture.detectChanges();
    button('Remove').click();
    fixture.detectChanges();
    expect(form.image.value).toBe('');
    expect(host.querySelector('img')).toBeNull();
    expect(button('Drag an image here').disabled).toBe(false);
  });

  it('uploads a dropped file and ignores drops while disabled', () => {
    const drop = (file: File): void => {
      const event = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', { value: { files: [file] } });
      find('.upload-surface').dispatchEvent(event);
      fixture.detectChanges();
    };
    form.image.disable();
    fixture.detectChanges();
    drop(png());
    expect(form.files).toHaveLength(0);

    form.image.enable();
    fixture.detectChanges();
    drop(png());
    expect(form.files).toHaveLength(1);
  });
});
