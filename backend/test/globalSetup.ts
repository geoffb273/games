import { execSync } from 'node:child_process';
import path from 'node:path';

const LOCAL_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/games';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = LOCAL_DATABASE_URL;
  process.env.DIRECT_URL = LOCAL_DATABASE_URL;
  process.env.JWT_SECRET = 'test';
  process.env.GRAPHQL_HIVE_ACCESS_TOKEN = 'test';
  process.env.ADMIN_SECRET = 'test';
}

const backendRoot = path.resolve(__dirname, '..');

if (process.env.CI) {
  execSync('pnpm exec prisma migrate deploy', {
    cwd: backendRoot,
    env: process.env,
    stdio: 'inherit',
  });
} else {
  execSync('pnpm exec prisma db push --force-reset', {
    cwd: backendRoot,
    env: process.env,
    stdio: 'inherit',
  });
}
