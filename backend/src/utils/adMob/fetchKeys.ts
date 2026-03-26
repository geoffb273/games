import { type Logger } from 'pino';

import { getAdMobKeysCache, setAdMobKeysCache } from '@/cache/advertisment/adMobKeys';
import { AdMobSsvVerificationError } from '@/schema/errors';

const VERIFIER_KEYS_URL = 'https://www.gstatic.com/admob/reward/verifier-keys.json';

/**
 * Fetches the AdMob verifier keys from the Google API.
 * @returns The AdMob verifier keys.
 */
export async function fetchAdMobKeys({
  logger,
}: {
  logger: Logger;
}): Promise<Record<number, Buffer>> {
  const keyCache = await getAdMobKeysCache({ logger });
  if (keyCache) {
    return keyCache;
  }

  const res = await fetch(VERIFIER_KEYS_URL);
  if (!res.ok) {
    throw new AdMobSsvVerificationError(`Failed to fetch AdMob verifier keys: ${res.status}`);
  }

  const data = (await res.json()) as { keys: Array<{ keyId: number; base64: string }> };
  const keysBuffer: Record<number, Buffer> = {};
  const keys: Record<number, string> = {};
  for (const k of data.keys) {
    keysBuffer[k.keyId] = Buffer.from(k.base64, 'base64');
    keys[k.keyId] = k.base64;
  }
  await setAdMobKeysCache({ keys });
  return keysBuffer;
}
