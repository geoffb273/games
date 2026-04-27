# AGENTS.md

## Cursor Cloud specific instructions

### Architecture

This is a monorepo with two independent packages (no pnpm workspaces):

- **backend/** — Node/Express + Apollo Server + Pothos GraphQL + Prisma (PostgreSQL) + Redis
- **mobile/** — Expo (React Native) + Apollo Client + Valtio
- **shared/** — `schema.graphql` consumed by both backend and mobile codegen

Each package has its own `pnpm-lock.yaml` and must be installed separately.

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
| Install deps (root) | `cd /workspace && pnpm install` |
| Install deps (backend) | `cd /workspace/backend && pnpm install` |
| Install deps (mobile) | `cd /workspace/mobile && pnpm install` |
| Generate Prisma client | `cd /workspace/backend && pnpm generate` |
| Run migrations | `cd /workspace/backend && pnpm migrate:deploy` |
| Start backend (dev) | `cd /workspace/backend && pnpm dev` |
| Backend lint | `cd /workspace/backend && pnpm lint` |
| Backend type-check | `cd /workspace/backend && pnpm tsc` |
| Backend tests | `cd /workspace/backend && CI=true pnpm test` |
| Check schema freshness | `cd /workspace/backend && pnpm check:schema` |
| Mobile lint | `cd /workspace/mobile && pnpm lint` |
| Mobile codegen | `cd /workspace/mobile && pnpm generate` |

### Gotchas

- **Tests must use `CI=true`**: The Vitest global setup (`test/globalSetup.ts`) runs `prisma migrate reset --force` by default, which Prisma blocks when invoked by Cursor AI agents. Setting `CI=true` makes it use `prisma migrate deploy` instead, which works correctly.
- **pnpm build scripts are ignored**: Backend install shows warnings about ignored build scripts (prisma, esbuild, etc.). `pnpm generate` handles Prisma client generation separately; the engines download happens automatically.
- **Mobile postinstall runs codegen**: `pnpm install` in mobile automatically triggers `pnpm generate` (graphql-codegen) via the `postinstall` script.
- **No pnpm workspaces**: Despite the monorepo structure, there is no `pnpm-workspace.yaml`. Install deps in each directory independently.
- **Backend dev server**: Runs on port 8080 with endpoints `/graphql`, `/hello`, and `/ad-mob-verification`.
