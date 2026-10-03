import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { fireEvent, within } from '@testing-library/dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContentApi } from '../../core/api/content.api';
import { I18nService } from '../../core/i18n/i18n.service';
import type {
  Category,
  ContentRecord,
  ContentSection,
  SocialLink,
} from '../../core/models/content.model';
import { AdminEditorComponent } from './admin-editor.component';
import { isContactLink, isWebLink, linkFor } from './forms/admin-form';

const WEB: Category = {
  id: 'cat-web',
  slug: 'web',
  position: 0,
  name: { en: 'Web', fr: 'Web', ar: 'ويب' },
};

/** The footer link saved on the live site before links were checked properly. */
const EMAIL_AS_SOCIAL: SocialLink = {
  id: 'social-email',
  name: 'E-mail',
  url: 'https://mailto:contact@dabadigital.ma',
  icon: 'mail',
  icon_url: '',
  status: 'published',
  position: 1,
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
  // Queries pass `hidden: true` where roles are involved, so nothing here depends on how
  // jsdom treats the contents of a modal dialog.
  const view = within(root);
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
  /** The message a field announces through `aria-describedby`. */
  const messageOf = (control: HTMLElement): string => {
    const id = control.getAttribute('aria-describedby') ?? '';
    return root.ownerDocument.getElementById(id)?.textContent?.trim() ?? '';
  };
  const english = () => within(view.getByRole('group', { name: 'English', hidden: true }));
  return {
    view,
    english,
    saved: fixture.componentInstance.saved,
    save,
    detect,
    find,
    messageOf,
    root,
    settle: async (): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
    },
  };
}

function fill(element: HTMLElement, value: string): void {
  fireEvent.input(element, { target: { value } });
}

function leave(element: HTMLElement): void {
  fireEvent.blur(element);
}

function chooseFile(input: HTMLElement, file: File): void {
  Object.defineProperty(input, 'files', { value: [file] });
  fireEvent.change(input);
}

describe('link checks', () => {
  it('accepts http(s) pages and refuses scripts, relative paths, bare domains and spaces', () => {
    expect(isWebLink('https://dabadigital.ma/work')).toBe(true);
    expect(isWebLink('http://localhost:4200')).toBe(true);
    expect(isWebLink('https://medium.com/@dabadigital')).toBe(true);
    expect(isWebLink('javascript:alert(1)')).toBe(false);
    expect(isWebLink('/relative/path')).toBe(false);
    expect(isWebLink('dabadigital.ma')).toBe(false);
    expect(isWebLink('https://dabadigital.ma/our work')).toBe(false);
  });

  it('refuses an email address with https:// in front of it', () => {
    expect(isWebLink('https://mailto:contact@dabadigital.ma')).toBe(false);
    expect(isWebLink('https://contact@dabadigital.ma')).toBe(false);
  });

  it('accepts mailto and tel links only for contact channels', () => {
    expect(isContactLink('mailto:hello@dabadigital.ma')).toBe(true);
    expect(isContactLink('tel:+212 5 22 00 00 00')).toBe(true);
    expect(isWebLink('mailto:hello@dabadigital.ma')).toBe(false);
    expect(isContactLink('mailto:not-an-email')).toBe(false);
  });

  it('derives the link for an email address or a phone number, and for nothing else', () => {
    expect(linkFor(' contact@dabadigital.ma ')).toBe('mailto:contact@dabadigital.ma');
    expect(linkFor('+212 6 12 34 56 78')).toBe('tel:+212612345678');
    expect(linkFor('mailto:contact@dabadigital.ma')).toBe('');
    expect(linkFor('Casablanca, Morocco')).toBe('');
    expect(linkFor('7/24h')).toBe('');
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
    const { view, english, saved, save, detect } = await open('projects');
    fill(view.getByLabelText(/^Name/), '  Atlas Platform  ');
    fill(english().getByLabelText(/^Short description/), ' A platform for Moroccan businesses. ');
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

  it('refuses a project without its English summary: the field says why and takes focus', async () => {
    const { view, english, saved, save, settle, messageOf, detect } = await open('projects');
    fill(view.getByLabelText(/^Name/), 'Atlas Platform');
    save();
    await settle();

    expect(saved).toHaveLength(0);
    const summary = english().getByLabelText(/^Short description/);
    expect(summary.getAttribute('aria-invalid')).toBe('true');
    expect(messageOf(summary)).toBe('This field is required.');
    expect(summary.ownerDocument.activeElement).toBe(summary);
    expect(view.getByRole('alert', { hidden: true }).textContent).toContain(
      'Check the highlighted fields (1)',
    );

    // The count beside Save follows the fix, and goes once nothing is left.
    fill(summary, 'A platform.');
    detect();
    expect(summary.getAttribute('aria-invalid')).toBe('false');
    expect(view.queryByRole('alert', { hidden: true })).toBeNull();
  });

  it('shows a problem once the field is left, not while it is being typed', async () => {
    const { view, saved, save, detect, messageOf } = await open('projects');
    const website = view.getByLabelText('Project website URL');
    fill(website, 'dabadigital.ma');
    detect();
    expect(website.getAttribute('aria-invalid')).toBe('false');

    leave(website);
    detect();
    expect(website.getAttribute('aria-invalid')).toBe('true');
    expect(messageOf(website)).toBe('Enter a full web address that starts with https://');
    save();
    expect(saved).toHaveLength(0);
  });

  it('edits a category in place, mapping its localized title back to its name', async () => {
    const { english, saved, save } = await open('categories', WEB);
    fill(english().getByLabelText(/^Title/), ' Web apps ');
    save();

    expect(saved).toEqual([
      { id: 'cat-web', position: 0, slug: 'web', name: { en: 'Web apps', fr: 'Web', ar: 'ويب' } },
    ]);
  });

  it('marks the English service description as required, as the database does', async () => {
    const { english, saved, save, messageOf } = await open('services');
    fill(english().getByLabelText(/^Title/), 'Cloud hosting');
    const description = english().getByLabelText(/^Full description/);
    expect(description.getAttribute('aria-required')).toBe('true');
    save();

    expect(saved).toHaveLength(0);
    expect(messageOf(description)).toBe('This field is required.');
  });

  it('saves an uploaded service icon in place of the built-in glyph', async () => {
    const uploadMedia = vi
      .spyOn(TestBed.inject(ContentApi), 'uploadMedia')
      .mockImplementation(async (file, folder) => `https://cdn.example/${folder}/${file.name}`);
    const { view, english, saved, save, detect, find, root, settle } = await open('services');
    fill(english().getByLabelText(/^Title/), 'Cloud hosting');
    fill(english().getByLabelText(/^Full description/), 'Managed hosting for your website.');
    // Uploaded, not picked: there is no list of icons to choose from.
    expect(view.queryByRole('combobox', { name: 'Icon', hidden: true })).toBeNull();
    expect(find('.fallback').textContent).toContain('built-in icon');

    chooseFile(
      find('input[type="file"]'),
      new File(['<svg/>'], 'cloud.svg', { type: 'image/svg+xml' }),
    );
    await settle();
    expect(root.querySelector('.fallback')).toBeNull();
    fireEvent.click(view.getByRole('combobox', { name: 'Status', hidden: true }));
    detect();
    fireEvent.click(view.getByRole('option', { name: 'Published', hidden: true }));
    fill(view.getByLabelText('Display order'), '4');
    save();

    expect(uploadMedia).toHaveBeenCalledWith(expect.any(File), 'icons');
    expect(saved[0]).toMatchObject({
      title: { en: 'Cloud hosting' },
      icon: 'code',
      icon_url: 'https://cdn.example/icons/cloud.svg',
      status: 'published',
      position: 4,
    });
  });

  it('refuses an email address saved as a social link, and says what it is', async () => {
    const { view, saved, save, messageOf } = await open('social', EMAIL_AS_SOCIAL);
    save();

    expect(saved).toHaveLength(0);
    const url = view.getByLabelText(/^Link URL/);
    expect(url.getAttribute('aria-invalid')).toBe('true');
    expect(messageOf(url)).toContain('This is an email address, not a web page');
  });

  it('keeps links out of a contact value and fills the link from the address', async () => {
    const { view, english, saved, save, detect, messageOf } = await open('contact');
    fill(english().getByLabelText(/^Label/), 'Email');
    const value = english().getByLabelText(/^Display value/);
    fill(value, 'mailto:contact@dabadigital.ma');
    leave(value);
    save();
    expect(saved).toHaveLength(0);
    expect(messageOf(value)).toContain('Write what visitors should read');

    fill(value, 'contact@dabadigital.ma');
    leave(value);
    detect();
    expect(view.getByLabelText<HTMLInputElement>(/^Link URL/).value).toBe(
      'mailto:contact@dabadigital.ma',
    );
    save();
    expect(saved[0]).toMatchObject({
      label: { en: 'Email' },
      value: { en: 'contact@dabadigital.ma' },
      href: 'mailto:contact@dabadigital.ma',
      icon: 'mail',
      icon_url: '',
    });
  });

  it('saves a team member with a role, a description, a portfolio and a portrait', async () => {
    const uploadMedia = vi
      .spyOn(TestBed.inject(ContentApi), 'uploadMedia')
      .mockImplementation(async (file, folder) => `https://cdn.example/${folder}/${file.name}`);
    const { view, english, saved, save, find, settle } = await open('team');
    fill(view.getByLabelText(/^Name/), ' Sara Alaoui ');
    fill(english().getByLabelText(/^Role/), 'Designer');
    fill(english().getByLabelText(/^Description/), 'Draws the interfaces.');
    fill(view.getByLabelText('Portfolio URL'), 'https://sara.example');
    chooseFile(find('input[type="file"]'), new File(['x'], 'sara.png', { type: 'image/png' }));
    await settle();
    save();

    expect(uploadMedia).toHaveBeenCalledWith(expect.any(File), 'team');
    expect(saved[0]).toMatchObject({
      name: 'Sara Alaoui',
      role: { en: 'Designer', fr: '', ar: '' },
      description: { en: 'Draws the interfaces.', fr: '', ar: '' },
      url: 'https://sara.example',
      photo_url: 'https://cdn.example/team/sara.png',
      status: 'draft',
    });
  });

  it('requires a team member’s English role and description', async () => {
    const { view, english, saved, save, messageOf } = await open('team');
    fill(view.getByLabelText(/^Name/), 'Sara Alaoui');
    save();

    expect(saved).toHaveLength(0);
    expect(messageOf(english().getByLabelText(/^Role/))).toBe('This field is required.');
    expect(messageOf(english().getByLabelText(/^Description/))).toBe('This field is required.');
    expect(view.getByRole('alert', { hidden: true }).textContent).toContain('(2)');
  });

  it('saves the year from the year picker and a cover uploaded through the content API', async () => {
    const uploadProjectImage = vi
      .spyOn(TestBed.inject(ContentApi), 'uploadProjectImage')
      .mockImplementation(async (file) => `https://cdn.example/${file.name}`);
    const { view, english, saved, save, detect, find, settle } = await open('projects');
    fill(view.getByLabelText(/^Name/), 'Atlas Platform');
    fill(english().getByLabelText(/^Short description/), 'A platform.');
    fireEvent.click(view.getByRole('combobox', { name: /^Year/, hidden: true }));
    detect();
    fireEvent.click(find('[data-date="2023"]'));
    chooseFile(find('input[type="file"]'), new File(['x'], 'cover.png', { type: 'image/png' }));
    await settle();
    save();

    expect(uploadProjectImage).toHaveBeenCalledOnce();
    expect(saved[0]).toMatchObject({ year: '2023', image_url: 'https://cdn.example/cover.png' });
  });

  it('holds the save while a cover upload is still in flight', async () => {
    vi.spyOn(TestBed.inject(ContentApi), 'uploadProjectImage').mockReturnValue(
      new Promise<string>(() => undefined),
    );
    const { view, english, saved, save, detect, find } = await open('projects');
    fill(view.getByLabelText(/^Name/), 'Atlas Platform');
    fill(english().getByLabelText(/^Short description/), 'A platform.');
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
