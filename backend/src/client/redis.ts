import { createClient, type RedisClientType } from 'redis';

import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from '@/constants';
import { logger } from '@/logger';

let redis: RedisClientType | null = null;

async function getRedis(): Promise<RedisClientType> {
  if (redis == null) {
    redis = createClient({
      username: REDIS_USERNAME,
      password: REDIS_PASSWORD,
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
    });

    redis.on('error', (err) => logger.error({ err }, 'Redis client error'));
    await redis.connect();
  }

  return redis;
}

export { getRedis };
