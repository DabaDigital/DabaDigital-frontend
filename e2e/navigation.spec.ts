import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US', reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  await page.route('**/supabase-config.json', (route) => route.fulfill({ json: {} }));
});

test('the hero CTA leads to the project form', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Build. Launch. Grow.' })).toBeVisible();

  await page.locator('#banner').getByRole('link', { name: 'Start a project' }).click();

  await expect(page).toHaveURL(/\/#contact$/);
  await expect(page.locator('#contact-fullName')).toBeInViewport();
});

test('an unknown path renders the not-found page', async ({ page }) => {
  await page.goto('/definitely-not-a-page');

  await expect(page.getByRole('heading', { level: 1 })).toContainText("n'existe pas");
});
