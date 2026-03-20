import { createClient, type RedisClientType } from 'redis';

import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from '@/constants';

const redis: RedisClientType = createClient({
  username: REDIS_USERNAME,
  password: REDIS_PASSWORD,
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

// eslint-disable-next-line no-console
redis.on('error', (err) => console.log('Redis Client Error', err));

await redis.connect();

export { redis };
