## Objective

Standardize success animation timing across puzzle/game completions so users see consistent pacing after a successful solve, while keeping all failure animation behavior unchanged.

Definition of done:
- Success completion wave timings are consistent across Flow, Hanji, Hashi, Slitherlink, and Minesweeper success paths.
- Failure timings/animations are unchanged.

## Scope

- App: `mobile`
- In scope:
  - Success completion wave timing constants in:
    - `mobile/src/components/game/FlowBoard/FlowCell.tsx`
    - `mobile/src/components/game/HanjiBoard/HanjiCell.tsx`
    - `mobile/src/components/game/HashiBoard/HashiIsland.tsx`
    - `mobile/src/components/game/SlitherlinkBoard/SlitherlinkCell.tsx`
    - `mobile/src/components/game/MinesweeperBoard/MinesweeperCell.tsx`
- Out of scope:
  - Failure animations (including Minesweeper explosion path and failure completion text behavior)
  - Backend/API/schema changes

## Breaking changes & migration

None. This is a client-side animation timing adjustment only.

## Assumptions

- “Standardize success animation timing” refers to the success completion wave timing profile across puzzle boards.
- Existing Flow/Minesweeper success timing profile is acceptable as the baseline.
- No separate codegen, GraphQL, or Prisma changes are required.

## Implementation plan

1. Inspect current success completion timing values in each board cell/island component.
2. Apply a shared timing profile to success wave sequences across:
   - `mobile/src/components/game/HanjiBoard/HanjiCell.tsx`
   - `mobile/src/components/game/HashiBoard/HashiIsland.tsx`
   - `mobile/src/components/game/SlitherlinkBoard/SlitherlinkCell.tsx`
   - (Flow and Minesweeper already aligned; keep as-is unless mismatch discovered)
3. Confirm failure paths remain unchanged, especially:
   - `completionAnimationType === 'explosion'` in `mobile/src/components/game/MinesweeperBoard/MinesweeperCell.tsx`
   - failure variant rendering in `mobile/src/components/game/GameCompleteText.tsx`
4. Run lint for the affected app:
   - `pnpm lint` from `mobile`

## Verification

- `cd mobile && pnpm lint`
- Manual verification expectation:
  - Complete each puzzle type successfully and confirm similar completion-wave pacing.
  - Trigger a Minesweeper loss and confirm failure animation behavior is unchanged.

## Done

- Added shared success completion timing constants in:
  - `mobile/src/components/game/successCompletionTiming.ts`
- Updated success wave animations to use the shared timing profile in:
  - `mobile/src/components/game/FlowBoard/FlowCell.tsx`
  - `mobile/src/components/game/HanjiBoard/HanjiCell.tsx`
  - `mobile/src/components/game/HashiBoard/HashiIsland.tsx`
  - `mobile/src/components/game/SlitherlinkBoard/SlitherlinkCell.tsx`
  - `mobile/src/components/game/MinesweeperBoard/MinesweeperCell.tsx`
- Kept failure behavior unchanged:
  - Minesweeper explosion path (`completionAnimationType !== 'wave'`) was not modified.
- Validation:
  - `ReadLints` reports no diagnostics in edited files.
  - `pnpm lint` could not run in this worktree due missing local dependencies (`expo` not found, `node_modules` missing).
