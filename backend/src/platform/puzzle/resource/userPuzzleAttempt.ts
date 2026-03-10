import {
  type FlowPuzzleData,
  type HanjiPuzzleData,
  type HashiPuzzleData,
  type MinesweeperPuzzleData,
  type SlitherlinkPuzzleData,
} from './puzzle';

export type UserPuzzleAttempt = {
  id: string;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  userId: string;
  puzzleId: string;
};

type BaseSolvePuzzleInput = {
  puzzleId: string;
  userId: string;
  startedAt: Date;
  /** Timestamp of completion. Only persisted if the solution is correct. */
  completedAt?: Date | null;
  /** Duration in milliseconds the user took to solve. Only persisted if the solution is correct. */
  durationMs?: number | null;
};

export type SolvePuzzleInput =
  | (BaseSolvePuzzleInput & {
      puzzleType: 'FLOW';
      solution?: FlowPuzzleData['solution'] | null;
    })
  | (BaseSolvePuzzleInput & {
      puzzleType: 'HANJI';
      solution?: HanjiPuzzleData['solution'] | null;
    })
  | (BaseSolvePuzzleInput & {
      puzzleType: 'HASHI';
      solution?: HashiPuzzleData['solution'] | null;
    })
  | (BaseSolvePuzzleInput & {
      puzzleType: 'MINESWEEPER';
      solution?: MinesweeperPuzzleData['solution'] | null;
    })
  | (BaseSolvePuzzleInput & {
      puzzleType: 'SLITHERLINK';
      solution?: SlitherlinkPuzzleData['solution'] | null;
    });
