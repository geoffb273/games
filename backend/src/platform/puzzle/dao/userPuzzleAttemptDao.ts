import { prisma } from '@/client/prisma';
import { Prisma } from '@/generated/prisma';
import { AlreadyExistsError, NotFoundError } from '@/schema/errors';
import { isAlreadyExistsError, isForeignKeyViolationError } from '@/utils/errorUtils';
import { serializePuzzleAttemptSpeedPercentageKey } from '@/utils/puzzle/attemptUtil';

import {
  type PuzzleAttemptSpeedPercentageKey,
  type UserPuzzleAttempt,
  type UserPuzzleHint,
} from '../resource/userPuzzleAttempt';

const USER_PUZZLE_ATTEMPT_SELECT = {
  id: true,
  startedAt: true,
  completedAt: true,
  durationMs: true,
  userId: true,
  puzzleId: true,
  hintsUsed: true,
} satisfies Prisma.UserPuzzleAttemptSelect;

const USER_PUZZLE_HINT_SELECT = {
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  puzzleId: true,
} satisfies Prisma.UserPuzzleHintSelect;

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

type PuzzleAttemptSpeedPercentageRow = {
  puzzleId: string;
  userId: string;
  durationMs: number;
  percentage: number;
};

/**
 * Batch-computes speed percentage for attempts.
 *
 * The percentage of other users' completed attempts for the same puzzle that are slower than the attempt.
 *
 * Counts ties as slower peers to inflate the percentage
 */
export async function getPuzzleAttemptSpeedPercentages({
  userId,
  keys,
}: {
  /** The user to compute speed percentages for */
  userId: string;
  keys: readonly PuzzleAttemptSpeedPercentageKey[];
}): Promise<Map<string, number>> {
  if (keys.length === 0) return new Map();

  const rows = await prisma.$queryRaw<PuzzleAttemptSpeedPercentageRow[]>(Prisma.sql`
    WITH keys AS (
      SELECT
        t."puzzleId"::uuid AS "puzzleId",
        t."userId"::uuid AS "userId",
        t."durationMs"::integer AS "durationMs"
      FROM unnest(
        ${keys.map((key) => key.puzzleId)}::text[],
        ${keys.map((_) => userId)}::text[],
        ${keys.map((key) => key.durationMs)}::integer[]
      ) AS t("puzzleId", "userId", "durationMs")
    )
    SELECT
      k."puzzleId"::text AS "puzzleId",
      k."userId"::text AS "userId",
      k."durationMs" AS "durationMs",
      CASE
        WHEN peer_stats."totalPeers" = 0 THEN 100.0
        ELSE (peer_stats."slowerPeers"::double precision / peer_stats."totalPeers"::double precision) * 100.0
      END AS "percentage"
    FROM keys k
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) AS "totalPeers",
        COUNT(*) FILTER (
          WHERE a."durationMs" IS NULL
            OR a."durationMs" >= k."durationMs"
        ) AS "slowerPeers"
      FROM "UserPuzzleAttempt" a
      WHERE a."puzzleId" = k."puzzleId"
        AND a."userId" != k."userId"
    ) AS peer_stats ON true
  `);

  return new Map(
    rows.map((row) => [
      serializePuzzleAttemptSpeedPercentageKey({
        puzzleId: row.puzzleId,
        durationMs: row.durationMs,
      }),
      row.percentage,
    ]),
  );
}

/**
 * Deletes all user puzzle attempts for a given user.
 */
export async function deleteUserPuzzleAttemptsByUserId({
  userId,
  tx,
}: {
  userId: string;
  tx: Prisma.TransactionClient;
}): Promise<void> {
  await tx.userPuzzleAttempt.deleteMany({
    where: {
      userId,
    },
  });
  await tx.userPuzzleHint.deleteMany({
    where: {
      userId,
    },
  });
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
  const hintsUsed = await prisma.userPuzzleHint.count({
    where: {
      userId,
      puzzleId,
    },
  });

  return prisma.userPuzzleAttempt
    .create({
      data: { userId, puzzleId, startedAt, completedAt, durationMs, hintsUsed },
      select: USER_PUZZLE_ATTEMPT_SELECT,
    })
    .catch((error) => {
      if (isAlreadyExistsError(error)) {
        throw new AlreadyExistsError('User puzzle attempt already exists');
      }
      throw error;
    });
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
