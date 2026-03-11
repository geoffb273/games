import type {
  HanjiPuzzleData,
  IncompleteHashiSolution,
  MinesweeperPuzzleData,
  SlitherlinkPuzzleData,
} from './puzzle';

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
};

export type RequestPuzzleHintInput =
  | (BaseRequestPuzzleHintInput & {
      puzzleType: 'HANJI';
      hanjiCurrentState?: HanjiPuzzleData['solution'] | null;
    })
  | (BaseRequestPuzzleHintInput & {
      puzzleType: 'HASHI';
      hashiCurrentState?: IncompleteHashiSolution | null;
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
