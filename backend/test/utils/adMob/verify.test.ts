import { createSign, generateKeyPairSync } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdMobSsvVerificationError } from '@/schema/errors';
import { createMockLogger } from '@/test/testUtils';
import { fetchAdMobKeys } from '@/utils/adMob/fetchKeys';
import { verifyAdMobSsvQueryString } from '@/utils/adMob/verify';

const TEST_KEY_ID = 9_999_001;
const logger = createMockLogger();

vi.mock('@/utils/adMob/fetchKeys');

function buildSignedQuery(content: string, privateKeyDer: Buffer, keyId: number): string {
  const sign = createSign('SHA256');
  sign.update(content, 'utf8');
  sign.end();
  const sigDer = sign.sign({
    key: privateKeyDer,
    format: 'der',
    type: 'pkcs8',
  });
  const sigB64 = sigDer.toString('base64');
  return `${content}&signature=${encodeURIComponent(sigB64)}&key_id=${keyId}`;
}

describe('verifyAdMobSsvQueryString', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves when signature and key_id are valid', async () => {
    const { privateKey, publicKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });

    vi.mocked(fetchAdMobKeys).mockResolvedValue({ [TEST_KEY_ID]: publicKey });

    const content =
      'ad_network=5450213213286189855&ad_unit=2747237135&reward_amount=1&reward_item=hints&timestamp=1507770365237&transaction_id=18fa792de1bca816048293fc71035638';
    const query = buildSignedQuery(content, privateKey, TEST_KEY_ID);

    await expect(verifyAdMobSsvQueryString({ rawQuery: query, logger })).resolves.toBeUndefined();
    expect(fetchAdMobKeys).toHaveBeenCalledTimes(1);
  });

  it('retries with fresh keys when first verification fails and then succeeds', async () => {
    const { publicKey: stalePublicKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });
    const { privateKey: freshPrivateKey, publicKey: freshPublicKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });

    vi.mocked(fetchAdMobKeys)
      .mockResolvedValueOnce({ [TEST_KEY_ID]: stalePublicKey })
      .mockResolvedValueOnce({ [TEST_KEY_ID]: freshPublicKey });

    const content =
      'ad_network=1&ad_unit=2&reward_amount=1&reward_item=x&timestamp=1&transaction_id=abc';
    const query = buildSignedQuery(content, freshPrivateKey, TEST_KEY_ID);

    await expect(verifyAdMobSsvQueryString({ rawQuery: query, logger })).resolves.toBeUndefined();
    expect(fetchAdMobKeys).toHaveBeenCalledTimes(2);
    expect(fetchAdMobKeys).toHaveBeenNthCalledWith(1, { logger });
    expect(fetchAdMobKeys).toHaveBeenNthCalledWith(2, { logger, forceRefresh: true });
  });

  it('rejects invalid signature', async () => {
    const { publicKey: mockPublicKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });
    const { privateKey: otherKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });

    vi.mocked(fetchAdMobKeys).mockResolvedValue({
      [TEST_KEY_ID]: mockPublicKey,
    });

    const content =
      'ad_network=1&ad_unit=2&reward_amount=1&reward_item=x&timestamp=1&transaction_id=abc';
    const query = buildSignedQuery(content, otherKey, TEST_KEY_ID);

    await expect(verifyAdMobSsvQueryString({ rawQuery: query, logger })).rejects.toBeInstanceOf(
      AdMobSsvVerificationError,
    );
    expect(fetchAdMobKeys).toHaveBeenCalledTimes(2);
    expect(fetchAdMobKeys).toHaveBeenNthCalledWith(1, { logger });
    expect(fetchAdMobKeys).toHaveBeenNthCalledWith(2, { logger, forceRefresh: true });
  });

  it('rejects when signature parameter is missing', async () => {
    const { publicKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });

    vi.mocked(fetchAdMobKeys).mockResolvedValue({ [TEST_KEY_ID]: publicKey });

    await expect(
      verifyAdMobSsvQueryString({ rawQuery: 'ad_network=1&key_id=1', logger }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[AdMobSsvVerificationError: Missing signature parameter]`,
    );
  });

  it('rejects when key_id parameter is missing', async () => {
    const { publicKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });

    vi.mocked(fetchAdMobKeys).mockResolvedValue({ [TEST_KEY_ID]: publicKey });

    await expect(
      verifyAdMobSsvQueryString({ rawQuery: 'ad_network=1&signature=abc', logger }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[AdMobSsvVerificationError: Missing key_id parameter]`,
    );
  });

  it('rejects unknown key_id', async () => {
    const { privateKey, publicKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });

    vi.mocked(fetchAdMobKeys).mockResolvedValue({ [TEST_KEY_ID]: publicKey });

    const content = 'ad_network=1&ad_unit=2&timestamp=1&transaction_id=x';
    const query = buildSignedQuery(content, privateKey, 55_555_555);

    await expect(
      verifyAdMobSsvQueryString({ rawQuery: query, logger }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[AdMobSsvVerificationError: Unknown key_id: 55555555]`,
    );
  });
});
