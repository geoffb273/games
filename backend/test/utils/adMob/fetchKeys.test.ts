import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdMobKeysCache, setAdMobKeysCache } from '@/cache/advertisment/adMobKeys';
import { fetchAdMobKeys } from '@/utils/adMob/fetchKeys';

const VERIFIER_KEYS_URL = 'https://www.gstatic.com/admob/reward/verifier-keys.json';

vi.mock('@/cache/advertisment/adMobKeys');

describe('fetchAdMobKeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns cached key buffers without fetching when the cache hits', async () => {
    const cached = { 42: Buffer.from([1, 2, 3]) };
    vi.mocked(getAdMobKeysCache).mockResolvedValue(cached);

    const result = await fetchAdMobKeys();

    expect(result).toBe(cached);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    expect(setAdMobKeysCache).not.toHaveBeenCalled();
  });

  it('fetches JSON, writes base64 keys to the cache, and returns decoded buffers on cache miss', async () => {
    vi.mocked(getAdMobKeysCache).mockResolvedValue(null);

    const a = Buffer.from('key-a');
    const b = Buffer.from('key-b');
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        keys: [
          { keyId: 10, base64: a.toString('base64') },
          { keyId: 20, base64: b.toString('base64') },
        ],
      }),
    } as Response);

    const result = await fetchAdMobKeys();

    expect(result[10]).toEqual(a);
    expect(result[20]).toEqual(b);
    expect(setAdMobKeysCache).toHaveBeenCalledWith({
      keys: {
        10: a.toString('base64'),
        20: b.toString('base64'),
      },
    });
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(VERIFIER_KEYS_URL);
  });

  it('throws AdMobSsvVerificationError when the HTTP response is not ok', async () => {
    vi.mocked(getAdMobKeysCache).mockResolvedValue(null);
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    await expect(fetchAdMobKeys()).rejects.toMatchObject({
      name: 'AdMobSsvVerificationError',
      message: 'Failed to fetch AdMob verifier keys: 503',
    });
    expect(setAdMobKeysCache).not.toHaveBeenCalled();
  });
});
