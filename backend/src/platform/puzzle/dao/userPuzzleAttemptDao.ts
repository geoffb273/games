import { prisma } from '@/client/prisma';
import { type Prisma } from '@/generated/prisma';

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
