import { expect, test, type Locator, type Page, type Route } from '@playwright/test';

test.use({ locale: 'en-US', colorScheme: 'light', reducedMotion: 'reduce' });

const requestUrl = '**/project_requests';
const description = 'We need an accessible online store for our Moroccan customers.';

async function chooseDropdown(page: Page, id: string, option: string): Promise<void> {
  const trigger = page.locator(`#${id}`);
  await trigger.click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

async function fillContact(page: Page): Promise<void> {
  await page.locator('#contact-fullName').fill('Sara Alaoui');
  await page.locator('#contact-email').fill('sara@example.com');
  await page.locator('#contact-company').fill('Atlas Studio');
  await chooseDropdown(page, 'contact-projectType', 'Online store');
  await chooseDropdown(page, 'contact-budget', '20,000 – 50,000 MAD');
  await page.locator('#contact-message').fill(description);
}

async function respond(route: Route, status = 201): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(status === 201 ? { reference: 'TEST-001' } : { error: 'unavailable' }),
  });
}

async function colors(control: Locator): Promise<string[]> {
  return control.evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.color, style.backgroundColor, style.borderColor];
  });
}

async function finishColorTransitions(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await Promise.allSettled(
      document
        .getAnimations()
        .filter((animation) => animation instanceof CSSTransition)
        .map((animation) => animation.finished),
    );
  });
}

test('contact controls validate, show a busy button and submit only once', async ({ page }) => {
  const requests: unknown[] = [];
  let releaseResponse = (): void => undefined;
  const responseReady = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route(requestUrl, async (route) => {
    requests.push(route.request().postDataJSON());
    await responseReady;
    await respond(route);
  });

  try {
    await page.goto('/');
    const submit = page.locator('#contact button[type="submit"]');
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(page.locator('#contact-fullName')).toBeFocused();
    await expect(page.locator('#contact-fullName')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#contact-projectType')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#contact-projectType')).toHaveAttribute(
      'aria-describedby',
      'contact-projectType-error',
    );
    await expect(page.locator('#contact-projectType-error')).toContainText('choose a project type');
    expect(requests).toHaveLength(0);

    await page.locator('#contact-email').fill('not-an-email');
    await page.locator('#contact-email').press('Tab');
    await expect(page.locator('#contact-email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#contact-email-error')).toBeVisible();

    await fillContact(page);
    await expect(page.locator('#contact-projectType')).toContainText('Online store');
    await expect(page.locator('#contact-projectType')).toHaveAttribute('aria-invalid', 'false');
    await expect(page.locator('#contact-email')).toHaveAttribute('aria-invalid', 'false');
    await expect(page.locator('#contact-budget')).toContainText('20,000 – 50,000 MAD');
    const idleWidth = await submit.evaluate((element) => element.getBoundingClientRect().width);
    await submit.click();

    await expect(submit).toBeDisabled();
    await expect(submit).toHaveAttribute('aria-busy', 'true');
    await expect(submit).toHaveAccessibleName('Sending…');
    await expect(submit.locator('.app-button__loader')).toBeVisible();
    await expect
      .poll(() => submit.evaluate((element) => element.getBoundingClientRect().width))
      .toBeCloseTo(idleWidth, 1);
    await expect.poll(() => requests.length).toBe(1);

    // A second physical click and Enter in a field must not duplicate the request.
    await submit.click({ force: true });
    await page.locator('#contact-company').press('Enter');
    expect(requests).toHaveLength(1);
    expect(requests[0]).toEqual({
      project_request: expect.objectContaining({
        full_name: 'Sara Alaoui',
        email: 'sara@example.com',
        company_name: 'Atlas Studio',
        project_type: 'ecommerce',
        budget: expect.objectContaining({ amount: 20_000, currency: 'MAD' }),
        description,
        locale: 'en',
      }),
    });

    releaseResponse();
    await expect(page.getByRole('heading', { name: 'We have your request.' })).toBeVisible();
    await expect(page.locator('#contact')).toContainText('sara@example.com');
    await page.getByRole('button', { name: 'Send another request' }).click();
    await expect(submit).toBeEnabled();
    await expect(page.locator('#contact-fullName')).toHaveValue('');
    expect(requests).toHaveLength(1);
  } finally {
    releaseResponse();
  }
});

test('a failed request restores the button and preserves the fields for retry', async ({
  page,
}) => {
  let attempts = 0;
  await page.route(requestUrl, async (route) => {
    attempts += 1;
    await respond(route, attempts === 1 ? 503 : 201);
  });
  await page.goto('/');
  await fillContact(page);
  await page.getByRole('button', { name: 'Send request', exact: true }).click();

  const retry = page.getByRole('button', { name: 'Try again', exact: true });
  await expect(retry).toBeEnabled();
  await expect(retry).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#contact').getByRole('alert')).toContainText(
    'We could not send your request',
  );
  await expect(page.locator('#contact-fullName')).toHaveValue('Sara Alaoui');
  await expect(page.locator('#contact-message')).toHaveValue(description);
  await expect(page.locator('#contact-projectType')).toContainText('Online store');
  await retry.click();
  await expect(page.getByRole('heading', { name: 'We have your request.' })).toBeVisible();
  expect(attempts).toBe(2);
});

test('project search combines with the category and offers clear and empty-state recovery', async ({
  page,
}) => {
  await page.goto('/');
  const projects = page.locator('#projects');
  const cards = projects.locator('a.card-link');
  const search = page.getByRole('searchbox', { name: 'Search projects' });
  const filters = page.getByRole('group', { name: 'Filter by type' });

  await expect(cards).toHaveCount(6);
  await filters.getByText('E-commerce', { exact: true }).click();
  await expect(filters.getByRole('radio', { name: 'E-commerce', exact: true })).toBeChecked();
  await expect(cards).toHaveCount(3);

  await search.fill('ATLAS');
  await expect(cards).toHaveText(['Riad Atlas']);
  await filters.getByText('All', { exact: true }).click();
  await expect(cards).toHaveText(['Atlas Cargo', 'Riad Atlas']);
  await expect(projects.getByRole('status')).toContainText('2 project(s) shown');

  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();
  await expect(cards).toHaveCount(6);

  await filters.getByText('Mobile', { exact: true }).click();
  await search.fill('no-such-project');
  await expect(cards).toHaveCount(0);
  await expect(projects.getByRole('status')).toContainText('0 project(s) shown');
  await page.getByRole('button', { name: 'Show all projects', exact: true }).click();
  await expect(search).toHaveValue('');
  await expect(filters.getByRole('radio', { name: 'All', exact: true })).toBeChecked();
  await expect(cards).toHaveCount(6);
});

test('all shared controls follow the selected theme and retain it after reload', async ({
  page,
}) => {
  await page.goto('/');
  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-theme', 'light');

  const controls = [
    page.locator('#contact-fullName'),
    page.locator('#contact-message'),
    page.locator('#contact-projectType'),
    page.locator('#contact-budget'),
    page.getByRole('searchbox', { name: 'Search projects' }),
    page.locator('#contact button[type="submit"]'),
    page
      .locator('#projects label')
      .filter({ has: page.getByRole('radio', { name: 'All', exact: true }) })
      .locator('span'),
  ];
  const light = await Promise.all(controls.map(colors));
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.mouse.move(0, 0);
  await expect(root).toHaveAttribute('data-theme', 'dark');
  for (let index = 0; index < controls.length; index += 1) {
    await expect.poll(() => colors(controls[index])).not.toEqual(light[index]);
  }
  await finishColorTransitions(page);
  const dark = await Promise.all(controls.map(colors));

  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => Promise.all(controls.map(colors))).toEqual(dark);
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await page.mouse.move(0, 0);
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect.poll(() => Promise.all(controls.map(colors))).toEqual(light);
});

test('the controls stay keyboard accessible on a narrow Arabic page without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Current language: English' }).click();
  await page.getByRole('menuitemradio', { name: /العربية/ }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

  const search = page.getByRole('searchbox', { name: 'البحث في المشاريع' });
  await search.fill('Atlas');
  await expect(page.locator('#projects a.card-link')).toHaveCount(2);
  await search.press('Tab');
  await page.keyboard.press('Enter');
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();

  const radios = page.locator('#projects').getByRole('radio');
  await radios.first().focus();
  await page.keyboard.press('ArrowDown');
  await expect(radios.nth(1)).toBeChecked();
  await expect(radios.nth(1)).toBeFocused();
  await expect(page.locator('#projects a.card-link')).toHaveCount(5);

  await page.locator('#contact-company').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#contact-projectType')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.locator('#contact-projectType')).toContainText('موقع تعريفي');
  await expect(page.locator('#contact-budget')).toBeFocused();
  await expect(page.locator('#contact-email')).toHaveAttribute('dir', 'ltr');

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  const bounds = await page
    .locator(
      '#contact input, #contact select, #contact textarea, #projects input[type="search"], #projects label',
    )
    .evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right };
      }),
    );
  for (const bound of bounds) {
    expect(bound.left).toBeGreaterThanOrEqual(0);
    expect(bound.right).toBeLessThanOrEqual(360);
  }
});
