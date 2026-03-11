import { ValidationError } from '@/schema/errors';

import { getPuzzle as getPuzzleDao } from '../dao/puzzleDao';
import { createUserPuzzleHint } from '../dao/userPuzzleHintDao';
import {
  type HanjiPuzzleData,
  type HashiPuzzleData,
  type IncompleteHashiSolution,
  type MinesweeperPuzzleData,
  type Puzzle,
  type SlitherlinkPuzzleData,
} from '../resource/puzzle';
import type { PuzzleHint, RequestPuzzleHintInput } from '../resource/userPuzzleHint';

/**
 * Returns one guaranteed part of the puzzle solution as a hint. Persists the hint
 * request via createUserPuzzleHint. FLOW is not supported.
 *
 * @throws {NotFoundError} if the puzzle is not found or user/puzzle not found (FK)
 * @throws {ValidationError} if puzzle type mismatch, FLOW requested, or puzzle already correct
 * @throws {AlreadyExistsError} if the DB still has unique on (userId, puzzleId) and hint already requested
 */
export async function requestPuzzleHint(input: RequestPuzzleHintInput): Promise<PuzzleHint> {
  const { userId, puzzleId, puzzleType } = input;

  const puzzle = await getPuzzleDao({ id: puzzleId });

  if (puzzle.type !== puzzleType) {
    throw new ValidationError('Puzzle type mismatch');
  }

  const hint = pickHint(puzzle, input);
  if (hint == null) {
    throw new ValidationError('Puzzle already matches solution');
  }

  await createUserPuzzleHint({ userId, puzzleId });

  return hint;
}

function pickHint(puzzle: Puzzle, input: RequestPuzzleHintInput): PuzzleHint | null {
  switch (input.puzzleType) {
    case 'HANJI':
      return pickHanjiHint({
        solution: (puzzle.data as HanjiPuzzleData).solution,
        currentState: input.hanjiCurrentState,
      });
    case 'HASHI':
      return pickHashiHint({
        solution: (puzzle.data as HashiPuzzleData).solution,
        currentState: input.hashiCurrentState,
      });
    case 'MINESWEEPER':
      return pickMinesweeperHint({
        solution: (puzzle.data as MinesweeperPuzzleData).solution,
        currentState: input.minesweeperCurrentState,
      });
    case 'SLITHERLINK':
      return pickSlitherlinkHint({
        solution: (puzzle.data as SlitherlinkPuzzleData).solution,
        currentState: input.slitherlinkCurrentState,
      });
    default:
      return null;
  }
}

function pickHanjiHint({
  solution,
  currentState,
}: {
  solution: HanjiPuzzleData['solution'];
  currentState: HanjiPuzzleData['solution'] | null | undefined;
}): PuzzleHint | null {
  for (let row = 0; row < solution.length; row++) {
    const solutionRow = solution[row];
    const currentRow = currentState?.[row];
    for (let col = 0; col < solutionRow.length; col++) {
      const solutionValue = solutionRow[col];
      const currentValue = currentRow?.[col];
      if (currentValue == null || currentValue !== solutionValue) {
        return { puzzleType: 'HANJI', row, col, value: solutionValue };
      }
    }
  }
  return null;
}

function pickHashiHint({
  solution,
  currentState,
}: {
  solution: HashiPuzzleData['solution'];
  currentState: IncompleteHashiSolution | null | undefined;
}): PuzzleHint | null {
  if (solution.length === 0) return null;
  if (currentState == null || currentState.length !== solution.length) {
    const b = solution[0];
    return {
      puzzleType: 'HASHI',
      from: b.from,
      to: b.to,
      bridges: b.bridges,
    };
  }
  for (let i = 0; i < solution.length; i++) {
    const expected = solution[i];
    const received = currentState[i];
    if (
      !received ||
      expected.from.row !== received.from.row ||
      expected.from.col !== received.from.col ||
      expected.to.row !== received.to.row ||
      expected.to.col !== received.to.col ||
      expected.bridges !== received.bridges
    ) {
      return {
        puzzleType: 'HASHI',
        from: expected.from,
        to: expected.to,
        bridges: expected.bridges,
      };
    }
  }
  return null;
}

function pickMinesweeperHint({
  solution,
  currentState,
}: {
  solution: MinesweeperPuzzleData['solution'];
  currentState: MinesweeperPuzzleData['solution'] | null | undefined;
}): PuzzleHint | null {
  for (let row = 0; row < solution.length; row++) {
    const solutionRow = solution[row];
    const currentRow = currentState?.[row];
    for (let col = 0; col < solutionRow.length; col++) {
      const solutionValue = solutionRow[col];
      const currentValue = currentRow?.[col];
      if (currentValue == null || currentValue !== solutionValue) {
        return { puzzleType: 'MINESWEEPER', row, col, isMine: solutionValue };
      }
    }
  }
  return null;
}

function pickSlitherlinkHint({
  solution,
  currentState,
}: {
  solution: SlitherlinkPuzzleData['solution'];
  currentState: SlitherlinkPuzzleData['solution'] | null | undefined;
}): PuzzleHint | null {
  const h = solution.horizontalEdges;
  for (let r = 0; r < h.length; r++) {
    const row = h[r];
    const currentRow = currentState?.horizontalEdges?.[r];
    for (let c = 0; c < row.length; c++) {
      const solutionFilled = row[c];
      const currentFilled = currentRow?.[c];
      if (currentFilled == null || currentFilled !== solutionFilled) {
        return {
          puzzleType: 'SLITHERLINK',
          row: r,
          col: c,
          edgeType: 'HORIZONTAL',
          filled: solutionFilled,
        };
      }
    }
  }
  const v = solution.verticalEdges;
  for (let r = 0; r < v.length; r++) {
    const row = v[r];
    const currentRow = currentState?.verticalEdges?.[r];
    for (let c = 0; c < row.length; c++) {
      const solutionFilled = row[c];
      const currentFilled = currentRow?.[c];
      if (currentFilled == null || currentFilled !== solutionFilled) {
        return {
          puzzleType: 'SLITHERLINK',
          row: r,
          col: c,
          edgeType: 'VERTICAL',
          filled: solutionFilled,
        };
      }
    }
  }
  return null;
}
