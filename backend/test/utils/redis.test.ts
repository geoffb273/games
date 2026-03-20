import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { redis } from '@/client/redis';
import { getJson, REDIS_PREFIX, setJson } from '@/utils/redis';

describe('redis utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getJson', () => {
    it('returns null when key is missing', async () => {
      const key = `missing-${randomUUID()}`;
      const schema = z.object({ value: z.string() });
      const getSpy = vi.spyOn(redis, 'get');

      const result = await getJson({
        client: redis,
        key,
        schema,
      });

      expect(result).toBeNull();
      expect(getSpy).toHaveBeenCalledWith(REDIS_PREFIX + key);
    });

    it('parses and validates JSON value', async () => {
      const key = `present-${randomUUID()}`;
      const schema = z.object({ value: z.string() });
      await redis.set(REDIS_PREFIX + key, JSON.stringify({ value: 'ok' }));

      const getSpy = vi.spyOn(redis, 'get');

      try {
        const result = await getJson({
          client: redis,
          key,
          schema,
        });

        expect(result).toEqual({ value: 'ok' });
        expect(getSpy).toHaveBeenCalledWith(REDIS_PREFIX + key);
      } finally {
        await redis.del(REDIS_PREFIX + key);
      }
    });

    it('returns null when redis value is not valid JSON', async () => {
      const key = `bad-json-${randomUUID()}`;
      await redis.set(REDIS_PREFIX + key, '{bad json}');

      const getSpy = vi.spyOn(redis, 'get');

      try {
        const result = await getJson({
          client: redis,
          key,
          schema: z.object({ value: z.string() }),
        });

        expect(result).toBeNull();
        expect(getSpy).toHaveBeenCalledWith(REDIS_PREFIX + key);
      } finally {
        await redis.del(REDIS_PREFIX + key);
      }
    });

    it('returns null when JSON does not match schema', async () => {
      const key = `bad-schema-${randomUUID()}`;
      await redis.set(REDIS_PREFIX + key, JSON.stringify({ value: 123 }));

      const getSpy = vi.spyOn(redis, 'get');

      try {
        const result = await getJson({
          client: redis,
          key,
          schema: z.object({ value: z.string() }),
        });

        expect(result).toBeNull();
        expect(getSpy).toHaveBeenCalledWith(REDIS_PREFIX + key);
      } finally {
        await redis.del(REDIS_PREFIX + key);
      }
    });
  });

  describe('setJson', () => {
    it('validates, serializes, and writes with EX expiration', async () => {
      const key = `write-${randomUUID()}`;
      const schema = z.object({ value: z.string() });
      const expirationMs = 60000;
      const setSpy = vi.spyOn(redis, 'set');

      try {
        await setJson({
          client: redis,
          key,
          schema,
          value: { value: 'ok' },
          expirationMs,
        });

        expect(setSpy).toHaveBeenCalledWith(REDIS_PREFIX + key, JSON.stringify({ value: 'ok' }), {
          expiration: { type: 'EX', value: expirationMs },
        });

        const raw = await redis.get(REDIS_PREFIX + key);
        expect(raw).toBe(JSON.stringify({ value: 'ok' }));
      } finally {
        await redis.del(REDIS_PREFIX + key);
      }
    });
  });
});
