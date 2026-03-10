import { UnknownError, ValidationError } from '@/schema/errors';
import { isValidFlowSolution } from '@/utils/puzzle/flow';

import { getPuzzle as getPuzzleDao } from '../dao/puzzleDao';
import { createUserPuzzleAttempt } from '../dao/userPuzzleAttemptDao';
import {
  type FlowPuzzleData,
  type HanjiPuzzleData,
  type HashiPuzzleData,
  type MinesweeperPuzzleData,
  type Puzzle,
  type SlitherlinkPuzzleData,
} from '../resource/puzzle';
import { type SolvePuzzleInput, type UserPuzzleAttempt } from '../resource/userPuzzleAttempt';

/**
 * Validates a user's submitted solution against the stored puzzle solution
 * and creates a `UserPuzzleAttempt`.
 *
 * @returns the created user puzzle attempt
 *
 * @throws {UnknownError} if the puzzle type is unknown or the puzzle type does not match the claimed puzzle type
 * @throws {AlreadyExistsError} if the user has already attempted this puzzle
 * @throws {NotFoundError} if the puzzle is not found
 * @throws {ValidationError} if the puzzle type does not match the claimed puzzle type
 */
export async function solvePuzzle(input: SolvePuzzleInput): Promise<UserPuzzleAttempt> {
  const { puzzleId, userId, startedAt, completedAt, durationMs } = input;

  const puzzle = await getPuzzleDao({ id: puzzleId });

  const isCorrect = isSolutionCorrect(puzzle, input);

  return createUserPuzzleAttempt({
    puzzleId: puzzle.id,
    userId,
    startedAt,
    completedAt: isCorrect ? completedAt : undefined,
    durationMs: isCorrect ? durationMs : undefined,
  });
}

/**
 * Validates a user's submitted solution against the stored puzzle solution
 * and returns a boolean indicating whether the solution is correct.
 *
 * @throws {UnknownError} if the puzzle type is unknown
 * @throws {ValidationError} if the puzzle type does not match the claimed puzzle type
 */
function isSolutionCorrect(puzzle: Puzzle, input: SolvePuzzleInput): boolean {
  if (puzzle.type !== input.puzzleType) {
    throw new ValidationError('Puzzle type mismatch');
  }

  const { solution, puzzleType } = input;

  // If the user did not submit a solution, the attempt is treated as if they did not solve the puzzle
  if (solution == null) {
    return false;
  }

  switch (puzzleType) {
    case 'FLOW': {
      const data = puzzle.data as FlowPuzzleData;
      return isValidFlowSolution(data.width, data.height, data.pairs, solution);
    }
    case 'HANJI':
      return isHanjiSolutionCorrect((puzzle.data as HanjiPuzzleData).solution, solution);
    case 'HASHI':
      return isHashiSolutionCorrect((puzzle.data as HashiPuzzleData).solution, solution);
    case 'MINESWEEPER':
      return isMinesweeperSolutionCorrect(
        (puzzle.data as MinesweeperPuzzleData).solution,
        solution,
      );
    case 'SLITHERLINK':
      return isSlitherlinkSolutionCorrect(
        (puzzle.data as SlitherlinkPuzzleData).solution,
        solution,
      );
    default:
      throw new UnknownError('Unknown puzzle type');
  }
}

function isHanjiSolutionCorrect(
  expected: HanjiPuzzleData['solution'],
  received: HanjiPuzzleData['solution'],
): boolean {
  if (expected.length !== received.length) {
    return false;
  }

  for (let row = 0; row < expected.length; row++) {
    const rowExpected = expected[row];
    const rowReceived = received[row];

    if (rowExpected.length !== rowReceived.length) {
      return false;
    }

    for (let col = 0; col < rowExpected.length; col++) {
      if (rowExpected[col] !== rowReceived[col]) {
        return false;
      }
    }
  }

  return true;
}

function isHashiSolutionCorrect(
  expected: HashiPuzzleData['solution'],
  received: HashiPuzzleData['solution'],
): boolean {
  if (expected.length !== received.length) {
    return false;
  }

  for (let i = 0; i < expected.length; i++) {
    const bridgeExpected = expected[i];
    const bridgeReceived = received[i];

    if (
      bridgeExpected.from.row !== bridgeReceived.from.row ||
      bridgeExpected.from.col !== bridgeReceived.from.col ||
      bridgeExpected.to.row !== bridgeReceived.to.row ||
      bridgeExpected.to.col !== bridgeReceived.to.col ||
      bridgeExpected.bridges !== bridgeReceived.bridges
    ) {
      return false;
    }
  }

  return true;
}

function isMinesweeperSolutionCorrect(
  expected: MinesweeperPuzzleData['solution'],
  received: MinesweeperPuzzleData['solution'],
): boolean {
  if (expected.length !== received.length) {
    return false;
  }

  for (let row = 0; row < expected.length; row++) {
    const rowExpected = expected[row];
    const rowReceived = received[row];

    if (rowExpected.length !== rowReceived.length) {
      return false;
    }

    for (let col = 0; col < rowExpected.length; col++) {
      if (rowExpected[col] !== rowReceived[col]) {
        return false;
      }
    }
  }

  return true;
}

function isSlitherlinkSolutionCorrect(
  expected: SlitherlinkPuzzleData['solution'],
  received: SlitherlinkPuzzleData['solution'],
): boolean {
  const expectedH = expected.horizontalEdges;
  const receivedH = received.horizontalEdges;
  const expectedV = expected.verticalEdges;
  const receivedV = received.verticalEdges;

  if (
    expectedH.length !== receivedH.length ||
    expectedH.some((row, idx) => row.length !== receivedH[idx]?.length)
  ) {
    return false;
  }

  if (
    expectedV.length !== receivedV.length ||
    expectedV.some((row, idx) => row.length !== receivedV[idx]?.length)
  ) {
    return false;
  }

  for (let r = 0; r < expectedH.length; r++) {
    for (let c = 0; c < expectedH[r].length; c++) {
      if (expectedH[r][c] !== receivedH[r][c]) {
        return false;
      }
    }
  }

  for (let r = 0; r < expectedV.length; r++) {
    for (let c = 0; c < expectedV[r].length; c++) {
      if (expectedV[r][c] !== receivedV[r][c]) {
        return false;
      }
    }
  }

  return true;
}
