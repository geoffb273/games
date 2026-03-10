import { prisma } from '@/client/prisma';
import { type Prisma } from '@/generated/prisma';
import { NotFoundError, UnknownError } from '@/schema/errors';
import { parseEnum } from '@/utils/enumUtils';
import { isForeignKeyViolationError, isNotFoundError } from '@/utils/errorUtils';

import {
  type FlowPuzzleData,
  flowPuzzleDataSchema,
  type HanjiPuzzleData,
  hanjiPuzzleDataSchema,
  type HashiPuzzleData,
  hashiPuzzleDataSchema,
  type MinesweeperPuzzleData,
  minesweeperPuzzleDataSchema,
  type Puzzle,
  PuzzleType,
  type SlitherlinkPuzzleData,
  slitherlinkPuzzleDataSchema,
} from '../resource/puzzle';

const PUZZLE_SELECT = {
  id: true,
  createdAt: true,
  updatedAt: true,
  dailyChallengeId: true,
  type: true,
  data: true,
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

/**
 * Creates puzzles for a daily challenge
 *
 * @throws {UnknownError} if the puzzles data is invalid
 * @throws {UnknownError} if the foreign key violation error is thrown
 */
export async function createPuzzles({
  dailyChallengeId,
  data: { flow, hanji, hashi, minesweeper, slitherlink },
}: {
  dailyChallengeId: string;
  data: {
    flow: FlowPuzzleData;
    hanji: HanjiPuzzleData;
    hashi: HashiPuzzleData;
    minesweeper: MinesweeperPuzzleData;
    slitherlink: SlitherlinkPuzzleData;
  };
}): Promise<Puzzle[]> {
  return prisma.$transaction(async (tx) => {
    const flowPuzzle = await createFlowPuzzle({ dailyChallengeId, data: flow, tx });
    const hanjiPuzzle = await createHanjiPuzzle({ dailyChallengeId, data: hanji, tx });
    const hashiPuzzle = await createHashiPuzzle({ dailyChallengeId, data: hashi, tx });
    const minesweeperPuzzle = await createMinesweeperPuzzle({
      dailyChallengeId,
      data: minesweeper,
      tx,
    });
    const slitherlinkPuzzle = await createSlitherlinkPuzzle({
      dailyChallengeId,
      data: slitherlink,
      tx,
    });
    return [flowPuzzle, hanjiPuzzle, hashiPuzzle, minesweeperPuzzle, slitherlinkPuzzle];
  });
}

async function createFlowPuzzle({
  dailyChallengeId,
  data,
  tx,
}: {
  dailyChallengeId: string;
  data: FlowPuzzleData;
  tx: Prisma.TransactionClient;
}): Promise<Puzzle> {
  const validatedData = flowPuzzleDataSchema.parse(data);

  return tx.puzzle
    .create({
      data: {
        dailyChallengeId,
        type: PuzzleType.FLOW,
        data: validatedData,
      },
      select: PUZZLE_SELECT,
    })
    .then(mapPuzzle)
    .catch((error) => {
      if (isForeignKeyViolationError(error)) {
        throw new UnknownError(`Daily challenge not found with id: ${dailyChallengeId}`);
      }
      throw error;
    });
}

async function createHanjiPuzzle({
  dailyChallengeId,
  data,
  tx,
}: {
  dailyChallengeId: string;
  data: HanjiPuzzleData;
  tx: Prisma.TransactionClient;
}): Promise<Puzzle> {
  const validatedData = hanjiPuzzleDataSchema.parse(data);

  return tx.puzzle
    .create({
      data: {
        dailyChallengeId,
        type: PuzzleType.HANJI,
        data: validatedData,
      },
      select: PUZZLE_SELECT,
    })
    .then(mapPuzzle)
    .catch((error) => {
      if (isForeignKeyViolationError(error)) {
        throw new UnknownError(`Daily challenge not found with id: ${dailyChallengeId}`);
      }
      throw error;
    });
}

async function createHashiPuzzle({
  dailyChallengeId,
  data,
  tx,
}: {
  dailyChallengeId: string;
  data: HashiPuzzleData;
  tx: Prisma.TransactionClient;
}): Promise<Puzzle> {
  const validatedData = hashiPuzzleDataSchema.parse(data);

  return tx.puzzle
    .create({
      data: {
        dailyChallengeId,
        type: PuzzleType.HASHI,
        data: validatedData,
      },
      select: PUZZLE_SELECT,
    })
    .then(mapPuzzle)
    .catch((error) => {
      if (isForeignKeyViolationError(error)) {
        throw new UnknownError(`Daily challenge not found with id: ${dailyChallengeId}`);
      }
      throw error;
    });
}

async function createMinesweeperPuzzle({
  dailyChallengeId,
  data,
  tx,
}: {
  dailyChallengeId: string;
  data: MinesweeperPuzzleData;
  tx: Prisma.TransactionClient;
}): Promise<Puzzle> {
  const validatedData = minesweeperPuzzleDataSchema.parse(data);

  return tx.puzzle
    .create({
      data: {
        dailyChallengeId,
        type: PuzzleType.MINESWEEPER,
        data: validatedData,
      },
      select: PUZZLE_SELECT,
    })
    .then(mapPuzzle)
    .catch((error) => {
      if (isForeignKeyViolationError(error)) {
        throw new UnknownError(`Daily challenge not found with id: ${dailyChallengeId}`);
      }
      throw error;
    });
}

async function createSlitherlinkPuzzle({
  dailyChallengeId,
  data,
  tx,
}: {
  dailyChallengeId: string;
  data: SlitherlinkPuzzleData;
  tx: Prisma.TransactionClient;
}): Promise<Puzzle> {
  const validatedData = slitherlinkPuzzleDataSchema.parse(data);

  return tx.puzzle
    .create({
      data: {
        dailyChallengeId,
        type: PuzzleType.SLITHERLINK,
        data: validatedData,
      },
      select: PUZZLE_SELECT,
    })
    .then(mapPuzzle)
    .catch((error) => {
      if (isForeignKeyViolationError(error)) {
        throw new UnknownError(`Daily challenge not found with id: ${dailyChallengeId}`);
      }
      throw error;
    });
}

// HELPERS
/**
 * Maps a puzzle from the database to the domain model
 *
 * @throws {UnknownError} if the puzzle type is unknown or the data is invalid
 */
function mapPuzzle(puzzle: Prisma.PuzzleGetPayload<{ select: typeof PUZZLE_SELECT }>): Puzzle {
  const base = {
    id: puzzle.id,
    createdAt: puzzle.createdAt,
    updatedAt: puzzle.updatedAt,
    dailyChallengeId: puzzle.dailyChallengeId,
    name: puzzle.puzzleType.name,
    description: puzzle.puzzleType.description,
  };

  try {
    const type = parseEnum(PuzzleType, puzzle.type);

    switch (type) {
      case PuzzleType.FLOW:
        return { ...base, type, data: flowPuzzleDataSchema.parse(puzzle.data) };
      case PuzzleType.HANJI:
        return { ...base, type, data: hanjiPuzzleDataSchema.parse(puzzle.data) };
      case PuzzleType.HASHI:
        return { ...base, type, data: hashiPuzzleDataSchema.parse(puzzle.data) };
      case PuzzleType.MINESWEEPER:
        return { ...base, type, data: minesweeperPuzzleDataSchema.parse(puzzle.data) };
      case PuzzleType.SLITHERLINK:
        return { ...base, type, data: slitherlinkPuzzleDataSchema.parse(puzzle.data) };
    }
  } catch (error) {
    throw new UnknownError(`Failed to map puzzle: ${error}`);
  }
}
