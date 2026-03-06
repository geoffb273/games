import { prisma } from '@/client/prisma';
import { type Prisma } from '@/generated/prisma';
import { AlreadyExistsError } from '@/schema/errors';
import { isAlreadyExistsError } from '@/utils/errorUtils';

import { type UserPuzzleAttempt } from '../resource/userPuzzleAttempt';

const USER_PUZZLE_ATTEMPT_SELECT = {
  id: true,
  startedAt: true,
  completedAt: true,
  durationMs: true,
  userId: true,
  puzzleId: true,
} satisfies Prisma.UserPuzzleAttemptSelect;

/**
 * Batch-loads user puzzle attempts for a given user across multiple puzzle IDs.
 *
 * @returns a map of puzzleId -> UserPuzzleAttempt (only includes entries that exist)
 */
export async function getUserPuzzleAttemptsByPuzzleIds({
  userId,
  puzzleIds,
}: {
  userId: string;
  puzzleIds: readonly string[];
}): Promise<Map<string, UserPuzzleAttempt>> {
  const attempts = await prisma.userPuzzleAttempt.findMany({
    where: {
      userId,
      puzzleId: { in: [...puzzleIds] },
    },
    select: USER_PUZZLE_ATTEMPT_SELECT,
  });

  return new Map(attempts.map((a) => [a.puzzleId, a]));
}

/**
 * Creates a new user puzzle attempt.
 *
 * @throws {AlreadyExistsError} if the user puzzle attempt already exists
 */
export async function createUserPuzzleAttempt({
  userId,
  puzzleId,
  startedAt,
  completedAt,
  durationMs,
}: {
  userId: string;
  puzzleId: string;
  startedAt: Date;
  /** Nullable because the puzzle may have not been solved */
  completedAt?: Date | null;
  /** Nullable because the puzzle may have not been solved */
  durationMs?: number | null;
}): Promise<UserPuzzleAttempt> {
  return prisma.userPuzzleAttempt
    .create({
      data: { userId, puzzleId, startedAt, completedAt, durationMs },
      select: USER_PUZZLE_ATTEMPT_SELECT,
    })
    .catch((error) => {
      if (isAlreadyExistsError(error)) {
        throw new AlreadyExistsError('User puzzle attempt already exists');
      }
      throw error;
    });
}
