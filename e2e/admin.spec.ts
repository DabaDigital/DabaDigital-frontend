import { expect, test } from '@playwright/test';
import { PNG, mockSupabase, signIn } from './admin-fixture';

test.use({ locale: 'en-US', colorScheme: 'dark', reducedMotion: 'reduce' });

test('admin sign-in protects routes, persists the session, and signs out', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/admin/projects');
  await expect(page).toHaveURL(/admin\/login/);
  await page.getByLabel('Email address', { exact: true }).fill('admin@dabadigital.ma');
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Unable to sign in');
  await page.getByLabel('Password', { exact: true }).fill('test-admin-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  await expect(page.locator('app-site-header')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.goto('/admin/messages');
  await expect(page).toHaveURL(/admin\/login/);
});

test('an authenticated account without an admin membership is refused', async ({ page }) => {
  await mockSupabase(page, { admin: false });
  await page.goto('/admin/login');
  await page.getByLabel('Email address', { exact: true }).fill('admin@dabadigital.ma');
  await page.getByLabel('Password', { exact: true }).fill('test-admin-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('does not have administrator access');
  await expect(page).toHaveURL(/admin\/login/);
});

test('projects can be created, filtered, edited, published, and deleted', async ({ page }) => {
  await mockSupabase(page);
  await signIn(page);
  await page.screenshot({ path: 'test-results/admin-overview.png', fullPage: true });
  await page.locator('.sidebar').getByRole('link', { name: 'Projects', exact: true }).click();
  await page.getByRole('button', { name: 'Add project', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'New item' });
  await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill('Atlas Platform');
  await dialog
    .getByRole('group', { name: 'English', exact: true })
    .getByLabel('Short description')
    .fill('A new platform for Moroccan businesses.');
  const categories = dialog.getByRole('combobox', { name: 'Project categories', exact: true });
  await categories.click();
  await page.getByRole('option', { name: 'Web', exact: true }).click();
  await expect(categories).toContainText('Web');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog).not.toBeVisible();
  await page.locator('.toolbar').getByText('Draft', { exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Draft', exact: true })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Atlas Platform', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('searchbox').fill('Atlas Platform');
  await page.getByRole('button', { name: 'Edit Atlas Platform', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Edit item' });
  await editor.getByRole('combobox', { name: 'Status', exact: true }).click();
  await page.getByRole('option', { name: 'Published', exact: true }).click();
  await expect(editor.getByRole('combobox', { name: 'Status', exact: true })).toContainText(
    'Published',
  );
  await editor.getByRole('button', { name: 'Save changes' }).click();
  await expect(editor).not.toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Atlas Platform', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Atlas Platform', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Atlas Platform', exact: true })).toBeVisible();
  await page.goto('/admin/projects');
  await page.getByRole('button', { name: 'Delete Atlas Platform', exact: true }).click();
  const confirm = page.getByRole('alertdialog', { name: 'Delete this item?' });
  await expect(confirm).toContainText('Atlas Platform');
  await confirm.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(confirm).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Atlas Platform', exact: true })).toHaveCount(0);
});

test('the project editor picks a year, steps the order and uploads a cover', async ({ page }) => {
  const tables = await mockSupabase(page);
  await signIn(page);
  await page.goto('/admin/projects');
  // Added after the workspace loaded: the editor refetches categories when it opens.
  const ai = '00000000-0000-4000-8000-000000000003';
  tables['dd_categories'].push({ id: ai, name: { en: 'AI', fr: 'IA', ar: 'ذكاء' }, slug: 'ai' });
  await page.getByRole('button', { name: 'Edit Neural Ledger', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Edit item' });

  const categories = editor.getByRole('combobox', { name: 'Project categories', exact: true });
  await expect(categories).toContainText('Web');
  await categories.click();
  const list = page.getByRole('listbox');
  await expect(list).toHaveAttribute('aria-multiselectable', 'true');
  await expect(list.getByRole('option', { name: 'Web', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await list.getByRole('option', { name: 'AI', exact: true }).click();
  await expect(categories).toContainText('AI');
  await page.keyboard.press('Escape');
  // The cover is a file upload only — no URL field beside it.
  await expect(
    editor.getByRole('group', { name: 'Cover image' }).locator('input:not([type="file"])'),
  ).toHaveCount(0);
  const year = editor.getByRole('combobox', { name: 'Year', exact: true });

  // The calendar floats in the top layer, so the dialog's scrolling body cannot clip it.
  await year.click();
  const calendar = page.getByRole('dialog', { name: 'Choose a year' });
  await expect(calendar).toBeVisible();
  await expect(calendar.getByRole('button', { name: '2025', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await expect(calendar).not.toBeVisible();
  await expect(year).toContainText('2023');
  await expect(year).toBeFocused();

  await editor.getByRole('button', { name: 'Increase', exact: true }).click();
  await expect(editor.getByRole('spinbutton', { name: 'Display order' })).toHaveValue('1');

  await editor.locator('input[type="file"]').setInputFiles({
    name: 'cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from(PNG, 'base64'),
  });
  await expect(editor.getByRole('img', { name: 'Preview: Cover image' })).toBeVisible();
  await expect(editor.locator('[aria-live="polite"]', { hasText: 'Image uploaded.' })).toHaveCount(
    1,
  );
  await editor.getByRole('button', { name: 'Save changes' }).click();
  await expect(editor).not.toBeVisible();

  const saved = tables['dd_projects'].find((project) => project['name'] === 'Neural Ledger');
  expect(saved).toMatchObject({ year: '2023', position: 1 });
  expect(saved?.['dd_project_categories']).toHaveLength(2);
  expect(String(saved?.['image_url'])).toMatch(
    /\/storage\/v1\/object\/public\/dd-project-images\/projects\/[\w-]+\.png$/,
  );
  expect(tables['storage.objects']).toHaveLength(1);
});

test('all content editors save and contact settings update the website', async ({ page }) => {
  await mockSupabase(page);
  await signIn(page);
  for (const section of ['categories', 'services', 'social', 'contact']) {
    await page.goto(`/admin/${section}`);
    await page.locator('.row-actions button').first().click();
    const dialog = page.getByRole('dialog', { name: 'Edit item' });
    if (section === 'social')
      await dialog.getByLabel('Link URL').fill('https://linkedin.com/company/new-studio');
    else {
      const group = dialog.getByRole('group', { name: 'English', exact: true });
      await group
        .getByLabel(section === 'contact' ? 'Display value' : 'Title')
        .fill(section === 'contact' ? 'team@dabadigital.ma' : 'Updated ' + section);
      if (section === 'contact')
        await dialog.getByLabel('Link URL').fill('mailto:team@dabadigital.ma');
    }
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('status')).toContainText('Changes saved');
  }
  await page.goto('/');
  await expect(
    page.locator('#contact').getByRole('link', { name: 'team@dabadigital.ma' }),
  ).toBeVisible();
  await expect(page.locator('#services')).toContainText('Updated services');
});

test('website contact submissions arrive in the inbox and can be triaged', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/');
  await page.locator('#contact-fullName').fill('Sara Alaoui');
  await page.locator('#contact-email').fill('sara@example.com');
  await page.locator('#contact-company').fill('Atlas Studio');
  await page.locator('#contact-projectType').click();
  await page.getByRole('option', { name: 'Online store', exact: true }).click();
  await page
    .locator('#contact-message')
    .fill('We would like to build an online store for our studio in Casablanca.');
  await page.getByRole('button', { name: 'Send request', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'We have your request.' })).toBeVisible();
  await signIn(page);
  await page.goto('/admin/messages');
  await page.getByRole('button', { name: /Sara Alaoui/ }).click();
  await expect(page.locator('.message-body')).toContainText('online store');
  await expect(page.getByRole('link', { name: 'Reply by email' })).toHaveAttribute(
    'href',
    /mailto:sara%40example.com/,
  );
  await page.getByRole('button', { name: 'Mark as replied' }).click();
  await expect(page.locator('.message-item .status')).toHaveText('Replied');
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.locator('.message-item .status')).toHaveText('Archived');
  await page.reload();
  await expect(page.locator('.message-item .status')).toHaveText('Archived');
});

test('mobile layout and Arabic navigation remain usable', async ({ page }) => {
  await mockSupabase(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.locator('.sidebar').getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add project' })).toBeVisible();
  await page.getByRole('button', { name: 'Add project' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.evaluate(() => localStorage.setItem('dabadigital.locale', 'ar'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { name: 'المشاريع', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
