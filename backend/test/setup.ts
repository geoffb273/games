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
execSync('pnpm exec prisma migrate reset --force', {
  cwd: backendRoot,
  env: process.env,
  stdio: 'inherit',
});
