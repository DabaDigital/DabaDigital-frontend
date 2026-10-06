import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US', reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  await page.route('**/supabase-config.json', (route) => route.fulfill({ json: {} }));
});

test('the hero CTA leads to the project form', async ({ page }) => {
  await page.goto('/en');

  await expect(page.getByRole('heading', { level: 1, name: 'Build. Launch. Grow.' })).toBeVisible();

  await page.locator('#banner').getByRole('link', { name: 'Start a project' }).click();

  await expect(page).toHaveURL(/\/en#contact$/);
  await expect(page.locator('#contact-fullName')).toBeInViewport();
});

/**
 * One address per language, so search engines can index all three: `/` is Arabic, the
 * primary locale, whatever the browser's language — the server, not the page, sends an
 * English or French browser to its own address (vercel.json).
 */
test('each language has its own address, and switching moves there without a reload', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1, name: 'Build. Launch. Grow.' })).toBeVisible();
  await page.evaluate(() => ((window as unknown as { stayed: boolean }).stayed = true));

  await page.getByRole('button', { name: 'Current language: English' }).click();
  await page.getByRole('menuitemradio', { name: /Français/ }).click();

  await expect(page).toHaveURL(/\/fr$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page).toHaveTitle(/Agence web et digitale/);
  expect(await page.evaluate(() => (window as unknown as { stayed?: boolean }).stayed)).toBe(true);

  // The choice is remembered: the root now leads straight to French.
  await page.goto('/');
  await expect(page).toHaveURL(/\/fr$/);
});

test('an unknown path renders the not-found page', async ({ page }) => {
  await page.goto('/definitely-not-a-page');

  await expect(page.getByRole('heading', { level: 1 })).toContainText("n'existe pas");
});
