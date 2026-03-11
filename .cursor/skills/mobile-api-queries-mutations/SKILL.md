---
name: mobile-api-queries-mutations
description: Add or modify GraphQL queries and mutations in mobile/src/api following domain structure, Apollo hooks, and generated types. Use when adding a new query/mutation, creating an API hook, or organizing operations under src/api.
---

# Mobile API: Queries and Mutations

Guide for adding queries and mutations in `mobile/src/api/` using Apollo Client and generated GraphQL types.

## Where to put code

- **Location**: `mobile/src/api/<domain>/` (e.g. `puzzle/`, `user/`, `dailyChallenge/`).
- **Files**: One operation per file when it’s the main export. Name by operation type:
  - Queries: `<name>Query.ts` (e.g. `puzzleQuery.ts`, `dailyChallengesQuery.ts`).
  - Mutations: `<name>Mutation.ts` (e.g. `solvePuzzleMutation.ts`, `authenticateDeviceMutation.ts`).
- **Domain types and fragments**: Co-locate in the same domain (e.g. `puzzle/puzzle.ts`). Register fragments with `fragmentRegistry` from `@/client/apollo`.

## Imports and codegen

- Use `gql` from `@apollo/client` for the operation string.
- Use `useQuery` / `useMutation` from `@apollo/client/react`.
- Import **generated** document and types from `@/generated/gql/graphql` (e.g. `PuzzleQueryDocument`, `PuzzleQueryQuery`, `SolvePuzzleMutationDocument`).
- After changing the schema or operations, run **`pnpm generate`** in the mobile app (or `pnpm --filter mobile generate`) so types stay in sync.

## Query pattern

1. Define the operation with `gql\`...\`` (query name and variables match backend).
2. For union/error responses, request `__typename` and handle branches:
   - Success: `QueryXSuccess` with a `data` field.
   - Errors: `Error` (with `message`), `NotFoundError`, etc.
3. Export a single hook (e.g. `usePuzzleQuery`) that:
   - Calls `useQuery(Document, { variables, skip?, ... })`.
   - Derives domain-friendly state: `isLoading`, `isError`, `isNotFound` (if applicable).
   - Maps response to domain types (e.g. `mapToPuzzle(data.puzzle.data)`) and returns `data | null` for success.
   - Returns `refetch` (and optionally `updateQuery`-based helpers for optimistic updates, or `fetchMore` for pagination).
4. Define an explicit return type for the hook (e.g. `UsePuzzleQueryResult`) with `isLoading`, `isError`, optional `isNotFound`, data, and refetch/helpers.

**Simple list query (no union):** Use the raw connection/edges shape; map to a small domain type (e.g. `DailyChallenge`) and expose `dailyChallenges`, `hasNextPage`, `fetchMore`, `isFetchingMore`, `refetch`.

**Pagination:** Use `first`/`after` (or backend equivalent), `pageInfo.hasNextPage` / `endCursor`, and `fetchMore` with updated variables; expose `isFetchingMore` via `networkStatus === 3` if needed.

## Mutation pattern

1. Define the operation with `gql\`...\`` (mutation name and input type match backend).
2. If the backend returns a union, request `__typename` and success/error branches (e.g. `MutationXSuccess` with `data`, `Error` with `message`).
3. Export a single hook (e.g. `useSolvePuzzle`, `useAuthenticateDevice`) that:
   - Calls `useMutation(Document)`.
   - Wraps the mutate function in `useCallback`: pass `variables: { input }`, await the result, then check `data?.operationName?.__typename === 'MutationXSuccess'` (or equivalent); on success return the payload (e.g. `data.operationName.data`), otherwise throw or handle error.
   - Returns `{ mutateFn, isLoading, isError }` (name the mutate fn by domain, e.g. `solvePuzzle`, `authenticateDevice`).
4. Keep input types in the same file or in the domain type file; use generated input types where they exist.

## Fragments and domain types

- Define fragments in the domain file (e.g. `puzzle.ts`) with `gql\`fragment X on Y { ... }\``.
- Register each fragment doc: `fragmentRegistry.register(XFragmentDoc)` (from `@/client/apollo`).
- Use `useFragment` and `FragmentType<typeof XFragmentDoc>` from `@/generated/gql` for reading; map fragment data to domain types (e.g. `Puzzle`, `PuzzleAttempt`) and export both the domain type and the mapper (e.g. `mapToPuzzle`, `mapToPuzzleFragment` for cache writes).
- Shared fragment for errors: `@/api/error` defines `ErrorFragment`; use `... on Error { __typename message }` (or the fragment) in operations when the backend returns `Error`.

## Conventions (match existing code)

- **Import order**: External (react, @apollo/client), then `@/generated/`, then `@/api/` or `@/client/`, then relative (`./puzzle`, `./user`).
- **Hooks**: One primary hook per file; return domain-oriented names (`puzzle`, `dailyChallenges`, `solvePuzzle`, `authenticateDevice`).
- **Errors**: On mutation failure, throw (or surface via `isError`); reserve `// TODO: ERROR LOGGING` where the codebase does.
- **Optimistic updates**: Use `updateQuery` in the query hook and a domain→fragment mapper (e.g. `mapToPuzzleFragment`) so cache updates match the query shape; document in the hook’s return type (e.g. `updateOptimisticallyPuzzleAttempt`).

## Checklist for a new operation

- [ ] Create or use a domain folder under `mobile/src/api/<domain>/`.
- [ ] Add operation in a `*Query.ts` or `*Mutation.ts` file; use generated document and types.
- [ ] For queries: handle union/error via `__typename`; return `isLoading`, `isError`, optional `isNotFound`, mapped data, `refetch` (and pagination/optimistic helpers if needed).
- [ ] For mutations: unwrap success/error in the callback; return the mutate function plus `isLoading` and `isError`.
- [ ] If using new fragments: define in domain file and register with `fragmentRegistry`.
- [ ] Run `pnpm generate` (in mobile) after schema or operation changes.
