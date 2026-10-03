import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';

import { SupabaseService } from './supabase.service';

const CONFIG = { url: 'https://abc.supabase.co', publishableKey: 'sb_publishable_test' };

/** Just enough of a `Response` for the service. */
function reply(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'status',
    json: () => Promise.resolve(body),
  } as Response;
}

async function configured(): Promise<{ service: SupabaseService; fetch: Mock }> {
  const fetch = vi.fn().mockResolvedValueOnce(reply(CONFIG));
  vi.stubGlobal('fetch', fetch);
  const service = new SupabaseService();
  await service.initialize();
  return { service, fetch };
}

describe('SupabaseService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is configured by the config file alone, without loading the client', async () => {
    const { service, fetch } = await configured();

    expect(service.configured()).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/supabase-config.json', { cache: 'no-store' });
  });

  it('reads public rows with a plain GET: the key in the query, no custom header', async () => {
    const { service, fetch } = await configured();
    fetch.mockResolvedValueOnce(reply([{ id: 'web' }]));

    const result = await service.select('dd_categories', { select: '*', order: 'position.asc' });

    expect(result).toEqual({ data: [{ id: 'web' }], error: null });
    // A header of its own would make the browser send a CORS preflight first.
    expect(fetch.mock.calls[1]).toEqual([
      'https://abc.supabase.co/rest/v1/dd_categories?select=*&order=position.asc&apikey=sb_publishable_test',
    ]);
  });

  it("passes PostgREST's error code through", async () => {
    const { service, fetch } = await configured();
    fetch.mockResolvedValueOnce(reply({ code: 'PGRST205', message: 'no such table' }, 404));

    const result = await service.select('dd_team_members', { select: '*' });

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('PGRST205');
    expect(result.error?.message).toBe('no such table');
  });

  it('neither reads nor connects without a config', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(reply({}, 404)));
    const service = new SupabaseService();
    await service.initialize();

    expect(service.configured()).toBe(false);
    await expect(service.select('dd_categories', {})).rejects.toThrow('supabase_not_configured');
    await expect(service.connect()).rejects.toThrow('supabase_not_configured');
  });
});
