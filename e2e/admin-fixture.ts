import { expect, type Page } from '@playwright/test';

const text = (en: string) => ({ en, fr: en, ar: en });
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const TEST_SUPABASE = 'https://dabadigital-test.supabase.co';
/** A 1×1 PNG, base64 — served for every public Storage object and used as an upload. */
export const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export async function mockSupabase(page: Page, options: { admin?: boolean; empty?: boolean } = {}) {
  const user = {
    id: id(999),
    email: 'admin@dabadigital.ma',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  const token = [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(
      JSON.stringify({
        sub: user.id,
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString('base64url'),
    'test-signature',
  ].join('.');
  const tables: Record<string, Record<string, unknown>[]> = {
    dd_admins: options.admin === false ? [] : [{ user_id: user.id }],
    dd_categories: [
      { id: id(1), name: text('Web'), slug: 'web', position: 0 },
      { id: id(2), name: text('E-commerce'), slug: 'ecommerce', position: 1 },
    ],
    dd_projects: [
      'Neural Ledger',
      'Aura Commerce',
      'Atlas Cargo',
      'Souk Connect',
      'Zellige Studio',
      'Riad Atlas',
    ].map((name, position) => ({
      id: id(10 + position),
      name,
      slug: name.toLowerCase().replaceAll(' ', '-'),
      summary: text('Digital experiences designed and built by DabaDigital.'),
      description: text('A complete project with a thoughtful interface and reliable performance.'),
      year: String(2025 - Math.floor(position / 2)),
      tone: position % 2 ? 'accent' : 'primary',
      image_url: '',
      website_url: '',
      status: 'published',
      position,
      updated_at: '2026-09-15T09:00:00Z',
      dd_project_categories: [{ category_id: id(1) }],
    })),
    dd_services: [
      'Websites and web apps',
      'E-commerce',
      'AI integration',
      'Mobile apps',
      'UI/UX design',
      'Hosting and maintenance',
    ].map((title, position) => ({
      id: id(30 + position),
      title: text(title),
      description: text('Thoughtful digital solutions for your business.'),
      icon: ['code', 'bag', 'sparkles', 'mobile', 'palette', 'cloud'][position],
      status: 'published',
      position,
    })),
    dd_social_links: [
      {
        id: id(40),
        name: 'LinkedIn',
        url: 'https://linkedin.com/company/dabadigital',
        icon: 'linkedin',
        status: 'published',
        position: 0,
      },
    ],
    dd_contact_channels: [
      {
        id: id(50),
        label: text('Email'),
        value: text('hello@dabadigital.ma'),
        href: 'mailto:hello@dabadigital.ma',
        icon: 'mail',
        status: 'published',
        position: 0,
      },
    ],
    dd_messages: [],
    'storage.objects': [],
  };
  if (options.empty)
    for (const table of Object.keys(tables)) if (table !== 'dd_admins') tables[table] = [];
  await page.route('**/supabase-config.json', (route) =>
    route.fulfill({ json: { url: TEST_SUPABASE, publishableKey: 'sb_publishable_test_key' } }),
  );
  await page.route(`${TEST_SUPABASE}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': '*',
        },
      });
      return;
    }
    const json = async (value: unknown, status = 200) =>
      route.fulfill({ status, json: value, headers: { 'access-control-allow-origin': '*' } });
    if (url.pathname.startsWith('/storage/v1/object/public/')) {
      await route.fulfill({
        contentType: 'image/png',
        body: Buffer.from(PNG, 'base64'),
        headers: { 'access-control-allow-origin': '*' },
      });
      return;
    }
    if (url.pathname.startsWith('/storage/v1/object/') && method === 'POST') {
      const key = url.pathname.replace('/storage/v1/object/', '');
      tables['storage.objects'].push({ name: key });
      await json({ Key: key, Id: id(900 + tables['storage.objects'].length) });
      return;
    }
    if (url.pathname === '/auth/v1/token') {
      if (request.postDataJSON().password === 'wrong-password') {
        await json({ msg: 'Invalid login credentials' }, 400);
        return;
      }
      await json({
        access_token: token,
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user,
      });
      return;
    }
    if (url.pathname === '/auth/v1/user') {
      await json(user);
      return;
    }
    if (url.pathname === '/auth/v1/logout') {
      await route.fulfill({ status: 204 });
      return;
    }
    if (url.pathname === '/rest/v1/rpc/dd_save_project') {
      const { project_data, category_ids } = request.postDataJSON();
      tables['dd_projects'] = tables['dd_projects'].filter((p) => p['id'] !== project_data.id);
      tables['dd_projects'].push({
        ...project_data,
        dd_project_categories: category_ids.map((category_id: string) => ({ category_id })),
      });
      await json(project_data.id);
      return;
    }
    const table = url.pathname.split('/').at(-1) ?? '';
    const rows = tables[table];
    if (!rows) {
      await json({ message: 'Unexpected test request' }, 404);
      return;
    }
    const queryId = url.searchParams.get('id')?.replace('eq.', '');
    if (method === 'POST') {
      const data = request.postDataJSON();
      const row = {
        ...data,
        ...(table === 'dd_messages' ? { status: 'new', created_at: new Date().toISOString() } : {}),
      };
      tables[table] = [...rows.filter((r) => r['id'] !== row.id), row];
      await json({ id: row.id }, 201);
      return;
    }
    if (method === 'PATCH') {
      tables[table] = rows.map((row) =>
        row['id'] === queryId ? { ...row, ...request.postDataJSON() } : row,
      );
      await json({ id: queryId });
      return;
    }
    if (method === 'DELETE') {
      tables[table] = rows.filter((row) => row['id'] !== queryId);
      await json({ id: queryId });
      return;
    }
    const selected = rows.filter(
      (row) =>
        !url.searchParams.has('status') ||
        row['status'] === url.searchParams.get('status')?.replace('eq.', ''),
    );
    await json(table === 'dd_admins' ? (selected[0] ?? null) : selected);
  });
  return tables;
}

export async function signIn(page: Page) {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel('Email address', { exact: true }).fill('admin@dabadigital.ma');
  await page.getByLabel('Password', { exact: true }).fill('test-admin-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your studio, at a glance.' })).toBeVisible();
}
