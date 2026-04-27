import { proxy, useSnapshot } from 'valtio';

type HashiBridgeSolutionEntry = {
  bridges: number;
  from: { row: number; col: number };
  to: { row: number; col: number };
};

export type HashiCompletionData = {
  type: 'HASHI';
  bridges: HashiBridgeSolutionEntry[];
};

/**
 * In-session completion data for a puzzle. Keyed by puzzleId.
 *
 * Currently only used to render a share image for the solved board after a
 * puzzle is completed in this session. This is intentionally not persisted:
 * if the user revisits an already-completed puzzle in a later session we
 * simply don't show the share action.
 */
export type PuzzleCompletionData = HashiCompletionData;

type PuzzleCompletionState = {
  byPuzzleId: Record<string, PuzzleCompletionData>;
};

const PuzzleCompletionStore = proxy<PuzzleCompletionState>({
  byPuzzleId: {},
});

export function setPuzzleCompletionData(puzzleId: string, data: PuzzleCompletionData): void {
  PuzzleCompletionStore.byPuzzleId[puzzleId] = data;
}

export function clearPuzzleCompletionData(puzzleId: string): void {
  delete PuzzleCompletionStore.byPuzzleId[puzzleId];
}

export function usePuzzleCompletionData(puzzleId: string): PuzzleCompletionData | null {
  const { byPuzzleId } = useSnapshot(PuzzleCompletionStore);
  return (byPuzzleId[puzzleId] as PuzzleCompletionData | undefined) ?? null;
}
