import { type RedisClientType } from 'redis';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { getJson, REDIS_PREFIX, setJson } from '@/utils/redis';

function createMockRedisClient(): RedisClientType {
  return {
    get: vi.fn(),
    set: vi.fn(),
  } as unknown as RedisClientType;
}

describe('redis utils', () => {
  describe('getJson', () => {
    it('returns null when key is missing', async () => {
      const client = createMockRedisClient();
      (client.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const schema = z.object({ value: z.string() });

      const result = await getJson({
        client,
        key: 'missing',
        schema,
      });

      expect(result).toBeNull();
      expect(client.get).toHaveBeenCalledWith(REDIS_PREFIX + 'missing');
    });

    it('parses and validates JSON value', async () => {
      const client = createMockRedisClient();
      (client.get as ReturnType<typeof vi.fn>).mockResolvedValue(JSON.stringify({ value: 'ok' }));
      const schema = z.object({ value: z.string() });

      const result = await getJson({
        client,
        key: 'present',
        schema,
      });

      expect(result).toEqual({ value: 'ok' });
    });

    it('throws when redis value is not valid JSON', async () => {
      const client = createMockRedisClient();
      (client.get as ReturnType<typeof vi.fn>).mockResolvedValue('{bad json}');
      const schema = z.object({ value: z.string() });

      expect(
        await getJson({
          client,
          key: 'bad-json',
          schema,
        }),
      ).toBeNull();
    });

    it('returns null when JSON does not match schema', async () => {
      const client = createMockRedisClient();
      (client.get as ReturnType<typeof vi.fn>).mockResolvedValue(JSON.stringify({ value: 123 }));
      const schema = z.object({ value: z.string() });

      expect(
        await getJson({
          client,
          key: 'bad-schema',
          schema,
        }),
      ).toBeNull();
    });
  });

  describe('setJson', () => {
    it('validates and serializes value before write', async () => {
      const client = createMockRedisClient();
      (client.set as ReturnType<typeof vi.fn>).mockResolvedValue('OK');
      const schema = z.object({ value: z.string() });

      await setJson({
        client,
        key: 'write',
        schema,
        value: { value: 'ok' },
        expirationMs: 60000,
      });

      expect(client.set).toHaveBeenCalledWith(
        REDIS_PREFIX + 'write',
        JSON.stringify({ value: 'ok' }),
        {
          expiration: { type: 'EX', value: 60000 },
        },
      );
    });

    it('passes redis set options through', async () => {
      const client = createMockRedisClient();
      (client.set as ReturnType<typeof vi.fn>).mockResolvedValue('OK');
      const schema = z.object({ value: z.string() });

      await setJson({
        client,
        key: 'write-with-options',
        schema,
        value: { value: 'ok' },
        expirationMs: 60000,
      });

      expect(client.set).toHaveBeenCalledWith(
        REDIS_PREFIX + 'write-with-options',
        JSON.stringify({ value: 'ok' }),
        {
          expiration: { type: 'EX', value: 60000 },
        },
      );
    });
  });
});
