import { type Logger } from 'pino';
import type { RedisClientType } from 'redis';
import type { input, output, ZodType } from 'zod';

import { safeParse } from './zodUtils';

type GetJsonArgs<TSchema extends ZodType> = {
  client: RedisClientType;
  key: string;
  schema: TSchema;
  logger: Logger;
};

type SetJsonArgs<TSchema extends ZodType> = {
  client: RedisClientType;
  key: string;
  schema: TSchema;
  value: input<TSchema>;
  expirationMs: number;
};

export const REDIS_PREFIX = 'game-brain:v1:';

export async function getJson<TSchema extends ZodType>({
  client,
  key,
  schema,
  logger,
}: GetJsonArgs<TSchema>): Promise<output<TSchema> | null> {
  const rawValue = await client.get(REDIS_PREFIX + key);
  if (rawValue === null) {
    return null;
  }
  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    return safeParse({ schema, value: parsedValue, logger });
  } catch {
    return null;
  }
}

export async function setJson<TSchema extends ZodType>({
  client,
  key,
  schema,
  value,
  expirationMs,
}: SetJsonArgs<TSchema>): Promise<void> {
  const parsedValue = schema.parse(value);
  const serializedValue = JSON.stringify(parsedValue);

  await client.set(REDIS_PREFIX + key, serializedValue, {
    expiration: { type: 'PX', value: expirationMs },
  });
}
