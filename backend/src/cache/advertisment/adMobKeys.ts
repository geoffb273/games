import { z } from 'zod';

import { getRedis } from '@/client/redis';
import { getJson, setJson } from '@/utils/redis';

const AD_MOB_KEYS_CACHE_KEY = 'ad-mob-keys';
const AD_MOB_KEYS_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

const KeyCacheSchema = z.object({
  keys: z.record(z.coerce.number(), z.string()),
});
type KeyCache = z.infer<typeof KeyCacheSchema>;

/**
 * Gets the AdMob keys cache from Redis.
 * @returns The AdMob keys cache or null if it doesn't exist.
 */
export async function getAdMobKeysCache(): Promise<Record<number, Buffer> | null> {
  const cache = await getJson({
    key: AD_MOB_KEYS_CACHE_KEY,
    schema: KeyCacheSchema,
    client: await getRedis(),
  });
  if (cache == null) {
    return null;
  }
  const keysBuffer: Record<number, Buffer> = {};
  for (const [keyId, base64] of Object.entries(cache.keys)) {
    keysBuffer[Number(keyId)] = Buffer.from(base64, 'base64');
  }
  return keysBuffer;
}

/**
 * Sets the AdMob keys cache in Redis.
 * @param keys The AdMob keys cache to set.
 */
export async function setAdMobKeysCache(keys: KeyCache): Promise<void> {
  await setJson({
    key: AD_MOB_KEYS_CACHE_KEY,
    schema: KeyCacheSchema,
    client: await getRedis(),
    value: keys,
    expirationMs: AD_MOB_KEYS_CACHE_TTL,
  });
}
