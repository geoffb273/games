# Backend – GraphQL API & Services

This directory contains the **backend API** for the games project. It’s a Node/Express + Apollo Server application with a **Pothos** GraphQL schema, **Prisma** for data access, and a **service/DAO architecture** under `src/platform`.

---

## 🚀 Overview

- **GraphQL API** built with Apollo Server and Pothos
- **PostgreSQL** database via Prisma ORM
- **Service / DAO architecture** under `src/platform`
- **Type-safe schema generation** and code-first GraphQL
- **Testing and tooling** with Vitest, ESLint, and TypeScript

The backend is designed so that it can evolve with new game modes or features without needing to rewrite core plumbing.

---

## 🧑‍💻 Local Development

From the **repo root**, install dependencies:

```bash
pnpm install
```

Then, from the **backend** directory:

```bash
cd backend

# (Optional) set up your .env with DATABASE_URL and any auth secrets

pnpm generate         # prisma generate
pnpm migrate:create   # create a new migration (dev)
pnpm migrate:deploy   # apply migrations
pnpm dev              # start the API in watch mode
```

By default the GraphQL server runs on `http://localhost:8080` (or whatever port is configured). You can hit the GraphQL endpoint directly or via the mobile app in `../mobile`.

---

## ⚙️ Environment

The backend expects a `.env` file (or environment variables) with at least:

- `DATABASE_URL` – PostgreSQL connection string
- Optionally: JWT / auth-related secrets (e.g. `JWT_SECRET`) if auth is enabled

Prisma uses `DATABASE_URL` for migrations and runtime database access.

---

## 📂 Project Structure

High-level layout:

```text
src/
  index.ts                # Express + Apollo server bootstrap
  generate-schema.ts      # Generates GraphQL schema
  platform/               # Domain-based services & DAOs
  schema/                 # GraphQL schema wiring & error types
  client/                 # Prisma client, external clients
```

### Platform layering (`src/platform`)

Each **domain** lives under `src/platform/<domain>/` with up to three subfolders:

- `resource/` – domain types and Zod schemas (no Prisma, no DB)
- `dao/` – data access only, using Prisma
- `service/` – business logic and orchestration, importing DAOs

**Key rules**:

- Controllers / schema only talk to **services** (and resource types), never DAOs.
- Services may coordinate multiple DAOs and use Prisma transactions when needed.
- DAOs are responsible for mapping Prisma errors into domain-specific error classes.

This structure keeps data access, business logic, and transport (GraphQL) clearly separated.

---

## 🧱 Architecture

- **GraphQL-first contract**
  - Pothos is used to define a strongly typed, code-first schema.
  - The schema acts as the contract between this backend and the mobile app; changes are deliberate and type-checked.

- **Service / DAO pattern**
  - DAOs wrap Prisma queries, define consistent `select` shapes, and map low-level errors to domain errors.
  - Services expose higher-level operations used by the schema, keeping business rules out of controllers.

- **Error handling strategy**
  - Prisma errors are mapped to domain error classes (e.g. `NotFoundError`, `AlreadyExistsError`, `ValidationError`).
  - The GraphQL layer translates those into appropriate error responses, so clients see stable error shapes.

- **Testing & quality**
  - Vitest is wired for unit tests on services and platform logic.
  - ESLint + TypeScript run via `pnpm lint` / `pnpm tsc` to catch issues before runtime.

---

## 🔍 Useful Scripts

From the `backend` directory:

- `pnpm dev` – start the server in watch mode
- `pnpm start` – start the server (no watch)
- `pnpm generate` – run `prisma generate`
- `pnpm generate:schema` – regenerate the GraphQL schema
- `pnpm check:schema` – ensure the generated schema is up to date
- `pnpm migrate:create` – create a new Prisma migration (dev)
- `pnpm migrate:deploy` – apply migrations
- `pnpm test` – run Vitest tests
- `pnpm lint` – run ESLint over `src/`
- `pnpm lint:fix` – auto-fix lint issues where possible
