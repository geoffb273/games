import { prisma } from '@/client/prisma';
import { type Prisma } from '@/generated/prisma';
import { AlreadyExistsError, NotFoundError } from '@/schema/errors';
import { isAlreadyExistsError, isForeignKeyViolationError } from '@/utils/errorUtils';

import { type UserPuzzleHint } from '../resource/userPuzzleHint';

const USER_PUZZLE_HINT_SELECT = {
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  puzzleId: true,
} satisfies Prisma.UserPuzzleHintSelect;

/**
 * Batch-loads user puzzle hints for a given user across multiple puzzle IDs.
 *
 * @returns a map of puzzleId -> UserPuzzleHint (only includes entries that exist)
 */
export async function getUserPuzzleHintsByPuzzleIds({
  userId,
  puzzleIds,
}: {
  userId: string;
  puzzleIds: readonly string[];
}): Promise<Map<string, UserPuzzleHint>> {
  const hints = await prisma.userPuzzleHint.findMany({
    where: {
      userId,
      puzzleId: { in: [...puzzleIds] },
    },
    select: USER_PUZZLE_HINT_SELECT,
  });

  return new Map(hints.map((h) => [h.puzzleId, h]));
}

/**
 * Creates a new user puzzle hint (records that the user requested a hint for the puzzle).
 *
 * @throws {AlreadyExistsError} if the user has already requested a hint for this puzzle
 * @throws {NotFoundError} if the user or puzzle does not exist (via foreign key)
 */
export async function createUserPuzzleHint({
  userId,
  puzzleId,
}: {
  userId: string;
  puzzleId: string;
}): Promise<UserPuzzleHint> {
  return prisma.userPuzzleHint
    .create({
      data: { userId, puzzleId },
      select: USER_PUZZLE_HINT_SELECT,
    })
    .catch((error) => {
      if (isAlreadyExistsError(error)) {
        throw new AlreadyExistsError('User has already requested a hint for this puzzle');
      }
      if (isForeignKeyViolationError(error)) {
        throw new NotFoundError('User or puzzle not found');
      }
      throw error;
    });
}
