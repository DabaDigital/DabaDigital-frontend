import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { fireEvent, within } from '@testing-library/dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContentApi } from '../../core/api/content.api';
import { I18nService } from '../../core/i18n/i18n.service';
import type { Category, ContentRecord, ContentSection } from '../../core/models/content.model';
import { AdminEditorComponent, validLink } from './admin-editor.component';

const WEB: Category = {
  id: 'cat-web',
  slug: 'web',
  position: 0,
  name: { en: 'Web', fr: 'Web', ar: 'ويب' },
};

@Component({
  selector: 'app-admin-editor-test-host',
  imports: [AdminEditorComponent],
  template: `
    <app-admin-editor
      [section]="section"
      [record]="record"
      [categories]="categories"
      (saved)="saved.push($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EditorHost {
  section: ContentSection = 'projects';
  record: ContentRecord | null = null;
  readonly categories = [WEB];
  readonly saved: ContentRecord[] = [];
}

async function open(section: ContentSection, record: ContentRecord | null = null) {
  const fixture = TestBed.createComponent(EditorHost);
  fixture.componentInstance.section = section;
  fixture.componentInstance.record = record;
  fixture.detectChanges();
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const save = (): void => {
    const form = root.querySelector('form');
    if (!form) throw new Error('editor form not rendered');
    fireEvent.submit(form);
    fixture.detectChanges();
  };
  const detect = (): void => fixture.detectChanges();
  const find = (selector: string): HTMLElement => {
    const element = root.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing element in test: ${selector}`);
    return element;
  };
  // Queries pass `hidden: true` where roles are involved, so nothing here depends on how
  // jsdom treats the contents of a modal dialog.
  return { view: within(root), saved: fixture.componentInstance.saved, save, detect, find };
}

function fill(element: HTMLElement, value: string): void {
  fireEvent.input(element, { target: { value } });
}

function chooseFile(input: HTMLElement, file: File): void {
  Object.defineProperty(input, 'files', { value: [file] });
  fireEvent.change(input);
}

describe('validLink', () => {
  it('accepts empty and http(s) links and rejects script or relative ones', () => {
    expect(validLink('')).toBe(true);
    expect(validLink('https://dabadigital.ma/work')).toBe(true);
    expect(validLink('http://localhost:4200')).toBe(true);
    expect(validLink('javascript:alert(1)')).toBe(false);
    expect(validLink('/relative/path')).toBe(false);
    expect(validLink('dabadigital.ma')).toBe(false);
  });

  it('accepts mailto and tel links only for contact channels', () => {
    expect(validLink('mailto:hello@dabadigital.ma', true)).toBe(true);
    expect(validLink('tel:+212 5 22 00 00 00', true)).toBe(true);
    expect(validLink('mailto:hello@dabadigital.ma')).toBe(false);
    expect(validLink('mailto:not-an-email', true)).toBe(false);
  });
});

describe('AdminEditorComponent', () => {
  beforeAll(() => {
    // jsdom does not implement modal dialogs; only the open state matters here.
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.open = false;
    };
  });

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EditorHost] });
    TestBed.inject(I18nService).setLocale('en');
  });

  it('saves a new project with a derived slug, trimmed text and the chosen category', async () => {
    const { view, saved, save, detect } = await open('projects');
    fill(view.getByLabelText(/^Name/), '  Atlas Platform  ');
    const english = within(view.getByRole('group', { name: 'English', hidden: true }));
    fill(english.getByLabelText(/^Short description/), ' A platform for Moroccan businesses. ');
    const categories = view.getByRole('combobox', { name: 'Project categories', hidden: true });
    fireEvent.click(categories);
    detect();
    fireEvent.click(view.getByRole('option', { name: 'Web', hidden: true }));
    detect();
    expect(categories.textContent).toContain('Web');
    save();

    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      name: 'Atlas Platform',
      slug: 'atlas-platform',
      summary: { en: 'A platform for Moroccan businesses.', fr: '', ar: '' },
      categories: ['cat-web'],
      status: 'draft',
      website_url: '',
    });
  });

  it('refuses to save a project without its English summary and says why', async () => {
    const { view, saved, save } = await open('projects');
    fill(view.getByLabelText(/^Name/), 'Atlas Platform');
    save();

    expect(saved).toHaveLength(0);
    expect(view.getByRole('alert', { hidden: true }).textContent).toContain('required fields');
  });

  it('refuses a project website link that is not http(s)', async () => {
    const { view, saved, save } = await open('projects');
    fill(view.getByLabelText(/^Name/), 'Atlas Platform');
    const english = within(view.getByRole('group', { name: 'English', hidden: true }));
    fill(english.getByLabelText(/^Short description/), 'A platform.');
    fill(view.getByLabelText('Project website URL'), 'javascript:alert(1)');
    save();

    expect(saved).toHaveLength(0);
  });

  it('edits a category in place, mapping its localized title back to its name', async () => {
    const { view, saved, save } = await open('categories', WEB);
    const english = within(view.getByRole('group', { name: 'English', hidden: true }));
    fill(english.getByLabelText(/^Title/), ' Web apps ');
    save();

    expect(saved).toEqual([
      { id: 'cat-web', position: 0, slug: 'web', name: { en: 'Web apps', fr: 'Web', ar: 'ويب' } },
    ]);
  });

  it('saves the icon and status picked from the translated dropdowns', async () => {
    const { view, saved, save, detect } = await open('services');
    const english = within(view.getByRole('group', { name: 'English', hidden: true }));
    fill(english.getByLabelText(/^Title/), 'Cloud hosting');
    fill(english.getByLabelText('Full description'), 'Managed hosting for your website.');
    fireEvent.click(view.getByRole('combobox', { name: 'Icon', hidden: true }));
    detect();
    fireEvent.click(view.getByRole('option', { name: 'Cloud', hidden: true }));
    fireEvent.click(view.getByRole('combobox', { name: 'Status', hidden: true }));
    detect();
    fireEvent.click(view.getByRole('option', { name: 'Published', hidden: true }));
    fill(view.getByLabelText('Display order'), '4');
    save();

    expect(saved[0]).toMatchObject({
      icon: 'cloud',
      status: 'published',
      position: 4,
      title: { en: 'Cloud hosting' },
    });
  });

  it('saves the year from the year picker and a cover uploaded through the content API', async () => {
    const uploadProjectImage = vi
      .spyOn(TestBed.inject(ContentApi), 'uploadProjectImage')
      .mockImplementation(async (file) => `https://cdn.example/${file.name}`);
    const { view, saved, save, detect, find } = await open('projects');
    fill(view.getByLabelText(/^Name/), 'Atlas Platform');
    const english = within(view.getByRole('group', { name: 'English', hidden: true }));
    fill(english.getByLabelText(/^Short description/), 'A platform.');
    fireEvent.click(view.getByRole('combobox', { name: /^Year/, hidden: true }));
    detect();
    fireEvent.click(find('[data-date="2023"]'));
    chooseFile(find('input[type="file"]'), new File(['x'], 'cover.png', { type: 'image/png' }));
    await new Promise((resolve) => setTimeout(resolve));
    detect();
    save();

    expect(uploadProjectImage).toHaveBeenCalledOnce();
    expect(saved[0]).toMatchObject({ year: '2023', image_url: 'https://cdn.example/cover.png' });
  });

  it('holds the save while a cover upload is still in flight', async () => {
    vi.spyOn(TestBed.inject(ContentApi), 'uploadProjectImage').mockReturnValue(
      new Promise<string>(() => undefined),
    );
    const { view, saved, save, detect, find } = await open('projects');
    fill(view.getByLabelText(/^Name/), 'Atlas Platform');
    const english = within(view.getByRole('group', { name: 'English', hidden: true }));
    fill(english.getByLabelText(/^Short description/), 'A platform.');
    chooseFile(find('input[type="file"]'), new File(['x'], 'cover.png', { type: 'image/png' }));
    detect();
    save();

    expect(saved).toHaveLength(0);
    expect(view.getByRole('button', { name: 'Save changes', hidden: true })).toHaveProperty(
      'disabled',
      true,
    );
  });
});
