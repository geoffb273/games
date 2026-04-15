import { type Logger } from 'pino';

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
  hintsUsed: number;
};

type BaseSolvePuzzleInput = {
  puzzleId: string;
  userId: string;
  startedAt: Date;
  /** Timestamp of completion. Only persisted if the solution is correct. */
  completedAt?: Date | null;
  /** Duration in milliseconds the user took to solve. Only persisted if the solution is correct. */
  durationMs?: number | null;
  logger: Logger;
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

export type UserPuzzleHint = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  puzzleId: string;
};

type BaseRequestPuzzleHintInput = {
  userId: string;
  puzzleId: string;
  uniqueKey?: string | null;
  logger: Logger;
};

export type RequestPuzzleHintInput =
  | (BaseRequestPuzzleHintInput & {
      puzzleType: 'HANJI';
      hanjiCurrentState?: HanjiPuzzleData['solution'] | null;
    })
  | (BaseRequestPuzzleHintInput & {
      puzzleType: 'HASHI';
      hashiCurrentState?: HashiPuzzleData['solution'] | null;
    })
  | (BaseRequestPuzzleHintInput & {
      puzzleType: 'MINESWEEPER';
      minesweeperCurrentState?: MinesweeperPuzzleData['solution'] | null;
    })
  | (BaseRequestPuzzleHintInput & {
      puzzleType: 'SLITHERLINK';
      slitherlinkCurrentState?: SlitherlinkPuzzleData['solution'] | null;
    });

export type PuzzleHint =
  | { puzzleType: 'HANJI'; row: number; col: number; value: number }
  | {
      puzzleType: 'HASHI';
      from: { row: number; col: number };
      to: { row: number; col: number };
      bridges: 1 | 2;
    }
  | { puzzleType: 'MINESWEEPER'; row: number; col: number; isMine: boolean }
  | {
      puzzleType: 'SLITHERLINK';
      row: number;
      col: number;
      edgeType: 'HORIZONTAL' | 'VERTICAL';
      filled: boolean;
    };

export type PuzzleAttemptSpeedPercentageKey = {
  puzzleId: string;
  durationMs: number;
};
