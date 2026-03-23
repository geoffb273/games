import { execSync } from 'node:child_process';
import path from 'node:path';

import { getRedis } from '@/client/redis';

const LOCAL_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/games';

/** Matches `redis` in `docker-compose.yml` (no ACL; empty auth). */
const LOCAL_REDIS_HOST = 'localhost';
const LOCAL_REDIS_PORT = '6379';
const LOCAL_REDIS_USERNAME = '';
const LOCAL_REDIS_PASSWORD = '';

export default async function globalSetup() {
  process.env.DATABASE_URL = LOCAL_DATABASE_URL;
  process.env.DIRECT_URL = LOCAL_DATABASE_URL;
  process.env.JWT_SECRET = 'test';
  process.env.GRAPHQL_HIVE_ACCESS_TOKEN = 'test';
  process.env.ADMIN_SECRET = 'test';

  process.env.REDIS_HOST = LOCAL_REDIS_HOST;
  process.env.REDIS_PORT = LOCAL_REDIS_PORT;
  process.env.REDIS_USERNAME = LOCAL_REDIS_USERNAME;
  process.env.REDIS_PASSWORD = LOCAL_REDIS_PASSWORD;

  const redis = await getRedis();
  await redis.flushDb();

  const backendRoot = path.resolve(__dirname, '..');

  // Use migrate reset so schema and all migration data (e.g. PuzzleType rows) are applied.
  // db push only applies schema and does not run migrations, so seed/migration inserts never run.
  if (process.env.CI) {
    execSync('pnpm exec prisma migrate deploy', {
      cwd: backendRoot,
      env: process.env,
      stdio: 'inherit',
    });
  } else {
    execSync('pnpm exec prisma migrate reset --force', {
      cwd: backendRoot,
      env: process.env,
      stdio: 'inherit',
    });
  }

  return async () => {
    if (redis.isOpen) {
      await redis.quit();
    }
  };
}
