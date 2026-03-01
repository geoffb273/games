import { prisma } from '@/client/prisma';
import { type Prisma } from '@/generated/prisma';
import { NotFoundError } from '@/schema/errors';
import { parseEnum } from '@/utils/enumUtils';
import { isNotFoundError } from '@/utils/errorUtils';

import {
  type HanjiPuzzleData,
  hanjiPuzzleDataSchema,
  type HashiPuzzleData,
  hashiPuzzleDataSchema,
  type MinesweeperPuzzleData,
  minesweeperPuzzleDataSchema,
  type Puzzle,
  PuzzleType,
} from '../resource/puzzle';

const PUZZLE_SELECT = {
  id: true,
  createdAt: true,
  updatedAt: true,
  dailyChallengeId: true,
  type: true,
  puzzleType: {
    select: {
      name: true,
      description: true,
    },
  },
} satisfies Prisma.PuzzleSelect;

/**
 * Gets a puzzle by id
 *
 * @throws {NotFoundError} if the puzzle is not found
 * @throws {UnknownError} if the puzzle type is unknown
 */
export async function getPuzzle({ id }: { id: string }): Promise<Puzzle> {
  return prisma.puzzle
    .findUniqueOrThrow({
      where: {
        id,
      },
      select: PUZZLE_SELECT,
    })
    .then(mapPuzzle)
    .catch((error) => {
      if (isNotFoundError(error)) {
        throw new NotFoundError(`Puzzle not found with id: ${id}`);
      }
      throw error;
    });
}

/**
 * Gets puzzles by daily challenge id
 *
 * returns an empty array if no puzzles are found with the given daily challenge id
 * @throws {UnknownError} if for any puzzle the puzzle type is unknown
 */
export async function getPuzzlesByDailyChallenge({
  dailyChallengeId,
}: {
  dailyChallengeId: string;
}): Promise<Puzzle[]> {
  return prisma.puzzle
    .findMany({
      where: {
        dailyChallengeId,
      },
      select: PUZZLE_SELECT,
    })
    .then((puzzles) => puzzles.map(mapPuzzle));
}

/**
 * Gets a map of daily challenge ids to puzzles
 *
 * @throws {UnknownError} if for any puzzle the puzzle type is unknown
 * @returns a map of daily challenge ids to puzzles. If a daily challenge id is not found/has no puzzles, it will not be included in the map
 */
export async function getDailyChallengeToPuzzlesMap({
  dailyChallengeIds,
}: {
  dailyChallengeIds: string[];
}): Promise<Map<string, Puzzle[]>> {
  const puzzles = await prisma.puzzle.findMany({
    where: {
      dailyChallengeId: {
        in: dailyChallengeIds,
      },
    },
    select: PUZZLE_SELECT,
  });

  return puzzles.reduce((acc, puzzle) => {
    const puzzleArr = acc.get(puzzle.dailyChallengeId) || [];
    puzzleArr.push(mapPuzzle(puzzle));
    acc.set(puzzle.dailyChallengeId, puzzleArr);
    return acc;
  }, new Map<string, Puzzle[]>());
}

export async function createHanjiPuzzle({
  dailyChallengeId,
  data,
}: {
  dailyChallengeId: string;
  data: HanjiPuzzleData;
}): Promise<Puzzle> {
  const validatedData = hanjiPuzzleDataSchema.parse(data);

  return prisma.puzzle
    .create({
      data: {
        dailyChallengeId,
        type: PuzzleType.HANJI,
        data: validatedData,
      },
      select: PUZZLE_SELECT,
    })
    .then(mapPuzzle);
}

export async function createHashiPuzzle({
  dailyChallengeId,
  data,
}: {
  dailyChallengeId: string;
  data: HashiPuzzleData;
}): Promise<Puzzle> {
  const validatedData = hashiPuzzleDataSchema.parse(data);

  return prisma.puzzle
    .create({
      data: {
        dailyChallengeId,
        type: PuzzleType.HASHI,
        data: validatedData,
      },
      select: PUZZLE_SELECT,
    })
    .then(mapPuzzle);
}

export async function createMinesweeperPuzzle({
  dailyChallengeId,
  data,
}: {
  dailyChallengeId: string;
  data: MinesweeperPuzzleData;
}): Promise<Puzzle> {
  const validatedData = minesweeperPuzzleDataSchema.parse(data);

  return prisma.puzzle
    .create({
      data: {
        dailyChallengeId,
        type: PuzzleType.MINESWEEPER,
        data: validatedData,
      },
      select: PUZZLE_SELECT,
    })
    .then(mapPuzzle);
}

// HELPERS
function mapPuzzle(puzzle: Prisma.PuzzleGetPayload<{ select: typeof PUZZLE_SELECT }>): Puzzle {
  return {
    id: puzzle.id,
    createdAt: puzzle.createdAt,
    updatedAt: puzzle.updatedAt,
    dailyChallengeId: puzzle.dailyChallengeId,
    type: parseEnum(PuzzleType, puzzle.type),
    name: puzzle.puzzleType.name,
    description: puzzle.puzzleType.description,
  };
}
