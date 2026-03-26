---
name: backend-dao-service
description: >
  Guide for creating DAO and service modules in backend/src/platform. Use this skill when:
  (1) adding a new platform domain (folder with dao/, service/, resource/),
  (2) adding or editing DAO files (data access, Prisma-only),
  (3) adding or editing service files (orchestration, business logic, calling DAOs),
  (4) deciding where to put Prisma, transactions, validation, or cross-domain calls.
license: MIT
metadata:
  version: '1.0.0'
allowed-tools: Read Write Edit Glob Grep
---

# Backend platform: DAO and service creation

This skill documents how to create and structure **DAO** and **service** files under `backend/src/<domain>/`, following the project’s layering so that schema, controllers, and scripts use **services only**, never DAOs directly.

## Platform structure

Each **domain** lives under `backend/src/<domain>/` (with platform level data such as `user`, `puzzle`, `dailyChallenge` all living in the `platform` domain) with up to three subfolders:

| Folder      | Purpose                                                                                                                                                                                                                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resource/` | Domain types and Zod schemas only. No Prisma, no DB. Used by services (types, validation) and schema.                                                                                                                                                                                                           |
| `dao/`      | Data access only. All Prisma usage. Returns domain types (from resource or Prisma payloads). Imported **only** by the same domain’s service layer.                                                                                                                                                              |
| `service/`  | Orchestration and business logic. Imports DAOs (same or other domains) and optionally `prisma` for transactions. Single entry service (e.g. `userService.ts`, `puzzleService.ts`) and optional “command” modules (e.g. `solvePuzzle.ts`, `createPuzzlesForDailyChallenge.ts`) that the main service re-exports. |

Example layout:

```
backend/src/platform/
  user/
    resource/user.ts           # User, AuthPayload types
    dao/userDao.ts
    service/userService.ts
  puzzle/
    resource/puzzle.ts
    resource/userPuzzleAttempt.ts
    dao/puzzleDao.ts
    dao/userPuzzleAttemptDao.ts
    service/puzzleService.ts
    service/solvePuzzle.ts
    service/createPuzzlesForDailyChallenge.ts
  dailyChallenge/
    resource/dailyChallenge.ts
    dao/dailyChallengeDao.ts
    service/dailyChallengeService.ts
```

```
backend/src/advertisment
  dao/
    advertisementRewardDao.ts
  resource/
    advertisementReward.ts
  service/
    advertisementRewardService.ts
```

## Layering rules

- **Controllers, schema, dataloaders, scripts**: import **services** and **resource** only. Never import DAOs.
- **Services**: import DAOs (same or other domains), other services when needed, `@/client/prisma` only for **transactions** that span multiple DAO calls.
- **DAOs**: import `@/client/prisma`, `@/schema/errors`, `@/utils/errorUtils`, and the domain **resource** (for types and Zod). No service imports.

## Creating a DAO file

1. **Location**: `backend/src/platform/<domain>/dao/<entity>Dao.ts` (e.g. `userDao.ts`, `puzzleDao.ts`).

2. **Imports**:
   - `prisma` from `@/client/prisma`
   - Prisma types from `@/generated/prisma` (e.g. `Prisma`, `User`)
   - Errors from `@/schema/errors` (e.g. `NotFoundError`, `AlreadyExistsError`)
   - Error guards from `@/utils/errorUtils`: `isNotFoundError`, `isAlreadyExistsError`, `isForeignKeyViolationError`
   - Domain types/schemas from `../resource/<domain>`

3. **Select constant**: Define a `const X_SELECT = { ... } satisfies Prisma.<Model>Select` and use it in every query so returned shape is consistent and type-safe.

4. **Functions**:
   - One exported async function per operation (e.g. `getUser`, `findOrCreateByDeviceId`, `createPuzzles`).
   - Use `prisma.<model>.*` for all DB access.
   - For `findUniqueOrThrow` / `delete` / similar, attach `.catch()` and map Prisma errors to schema errors via `isNotFoundError` etc., then rethrow.
   - Return domain types: either use a `mapToX()` helper that converts Prisma payload to resource type, or return the result of a Zod parse.
   - For transactions that span multiple operations in the **same** DAO, use `prisma.$transaction(async (tx) => { ... })` and pass `tx` to internal helpers; use `Prisma.TransactionClient` for `tx` type.

5. **JSDoc**: Document `@throws` for each function that can throw schema errors.

6. **Validation**: Validate input (e.g. JSON `data` for puzzle types) with Zod from resource before writing; throw `UnknownError` or `ValidationError` on parse failure. Map Prisma foreign key errors to `UnknownError` or `NotFoundError` as appropriate.

7. **Mapping**: When adding helpers to map from Prisma types to resource types add helper to bottom of the files

Example (conceptual):

```typescript
import { prisma } from '@/client/prisma';
import { type Prisma, type User } from '@/generated/prisma';
import { NotFoundError } from '@/schema/errors';
import { isNotFoundError } from '@/utils/errorUtils';

const USER_SELECT = { id: true, deviceId: true } satisfies Prisma.UserSelect;

/** @throws {NotFoundError} if the user does not exist */
export async function getUser({ id }: { id: string }): Promise<User> {
  return prisma.user.findUniqueOrThrow({ where: { id }, select: USER_SELECT }).catch((error) => {
    if (isNotFoundError(error)) throw new NotFoundError('User with the provided ID does not exist');
    throw error;
  });
}

function mapUser({ userId, deviceId }: Prisma.UserGetPayload<{ select: typeof USER_SELECT }>) {
  return { userId, deviceId };
}
```

## Creating or extending a service file

1. **Main service**: `backend/src/platform/<domain>/service/<domain>Service.ts` (e.g. `userService.ts`, `puzzleService.ts`). This is the single entry point the rest of the app uses.

2. **Imports**:
   - DAO functions from `../dao/*` (same domain or other domains).
   - Other **services** when you need cross-domain orchestration (e.g. `dailyChallengeService` calling `createPuzzlesForDailyChallenge` from puzzle service).
   - `prisma` from `@/client/prisma` **only** when you need a transaction that spans multiple DAO calls.
   - Types from `../resource/*`.

3. **Thin pass-through**: For operations that are pure data access with no extra logic, the service can simply call the DAO and return (e.g. `getUser`, `getPuzzle`, `getPuzzlesByDailyChallenge`).

4. **Orchestration**: When the use case involves multiple DAOs or side effects (e.g. auth token, delete user + attempts), implement in the service: call DAOs and/or other services, optionally inside `prisma.$transaction(...)`.

5. **Command modules**: For a multi-step or complex operation, implement it in a dedicated file under `service/` (e.g. `solvePuzzle.ts`, `createPuzzlesForDailyChallenge.ts`) and **re-export** it from the main service so callers still only use the main service.

Example (transaction in service):

```typescript
// platform/user/service/userService.ts
import { prisma } from '@/client/prisma';
import { deleteUserPuzzleAttemptsByUserId } from '@/platform/puzzle/dao/userPuzzleAttemptDao';
import { deleteUser, findOrCreateByDeviceId, getUser as getUserDao } from '../dao/userDao';

export async function getUser({ id }: { id: string }) {
  return getUserDao({ id });
}

export async function deleteUserProgress({ userId }: { userId: string }) {
  await prisma.$transaction(async () => {
    await deleteUserPuzzleAttemptsByUserId({ userId });
    await deleteUser({ id: userId });
  });
}
```

## Error handling

- **Schema errors**: Throw classes from `@/schema/errors` (e.g. `NotFoundError`, `AlreadyExistsError`, `ValidationError`, `UnknownError`). DAOs map Prisma errors via `@/utils/errorUtils`; services throw when validation or business rules fail.
- **Prisma P2025**: use `isNotFoundError` → `NotFoundError`.
- **Prisma P2002**: use `isAlreadyExistsError` → `AlreadyExistsError`.
- **Prisma P2003**: use `isForeignKeyViolationError` → typically `UnknownError` or `NotFoundError` with a clear message.

## Checklist for new domain or new entity

- [ ] Add or reuse types (and Zod schemas) in `resource/`.
- [ ] Add DAO in `dao/` with select constant, Prisma-only logic, and error mapping.
- [ ] Add or extend service in `service/`: either main service only or main service + command module that main service re-exports.
- [ ] Ensure no controller, schema, or script imports the DAO; they use the service and resource only.
