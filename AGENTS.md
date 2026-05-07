# AGENTS.md

## Cursor Cloud specific instructions

### Architecture

This is a pnpm workspace monorepo with three packages:

- **backend/** — Node/Express + Apollo Server + Pothos GraphQL + Prisma (PostgreSQL) + Redis
- **backend/deployment/** — deployment-focused backend package
- **mobile/** — Expo (React Native) + Apollo Client + Valtio
- **shared/** — `schema.graphql` consumed by both backend and mobile codegen

Workspace packages are declared in `pnpm-workspace.yaml` (`backend`, `backend/deployment`, and `mobile`) and use a single root `pnpm-lock.yaml`.

### Infrastructure (Docker)

PostgreSQL 16 and Redis 7 run via `docker compose up -d` from `backend/`. The backend requires both at runtime.

### Environment variables

The backend validates all env vars at startup via Zod in `src/constants.ts`. A `.env` file in `backend/` is loaded by `dotenv/config`. Required vars:

- `DATABASE_URL`, `DIRECT_URL` — PostgreSQL connection (local: `postgresql://postgres:postgres@localhost:5432/games`)
- `JWT_SECRET`, `ADMIN_SECRET` — any string for local dev
- `GRAPHQL_HIVE_ACCESS_TOKEN` — can be `"test"` locally
- `REDIS_HOST=localhost`, `REDIS_PORT=6379`, `REDIS_USERNAME=`, `REDIS_PASSWORD=`

### Key commands

| Task | Command |
|---|---|
| Install deps (workspace) | `cd /workspace && pnpm install` |
| Install deps (single package, optional) | `cd /workspace && pnpm --filter backend install` |
| Generate Prisma client | `cd /workspace && pnpm --filter backend generate` |
| Run migrations | `cd /workspace && pnpm --filter backend migrate:deploy` |
| Start backend (dev) | `cd /workspace && pnpm --filter backend dev` |
| Backend lint | `cd /workspace && pnpm --filter backend lint` |
| Backend type-check | `cd /workspace && pnpm --filter backend tsc` |
| Backend tests | `cd /workspace && CI=true pnpm --filter backend test` |
| Check schema freshness | `cd /workspace && pnpm --filter backend check:schema` |
| Mobile lint | `cd /workspace && pnpm --filter game-brain-mobile lint` |
| Mobile codegen | `cd /workspace && pnpm --filter game-brain-mobile generate` |

### Gotchas

- **Tests must use `CI=true`**: The Vitest global setup (`test/globalSetup.ts`) runs `prisma migrate reset --force` by default, which Prisma blocks when invoked by Cursor AI agents. Setting `CI=true` makes it use `prisma migrate deploy` instead, which works correctly.
- **pnpm build scripts are ignored**: Backend install shows warnings about ignored build scripts (prisma, esbuild, etc.). `pnpm generate` handles Prisma client generation separately; the engines download happens automatically.
- **Mobile postinstall runs codegen**: `pnpm install` at the workspace root can trigger mobile codegen through the mobile `postinstall` script.
- **Use workspace filters from root**: Prefer `pnpm --filter <package> <command>` from repo root instead of changing directories.
- **Backend dev server**: Runs on port 8080 with endpoints `/graphql`, `/hello`, and `/ad-mob-verification`.
