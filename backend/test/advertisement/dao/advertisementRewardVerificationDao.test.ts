import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAdvertisementRewardVerification,
  getAdvertisementRewardVerification,
} from '@/advertisement/dao/advertisementRewardVerificationDao';
import { AdvertisementRewardType } from '@/advertisement/resource/advertisementRewardVerification';
import { prisma } from '@/client/prisma';
import type { HanjiPuzzleData } from '@/platform/puzzle/resource/puzzle';
import { AlreadyExistsError, NotFoundError } from '@/schema/errors';
import { createTestDailyChallenge, createTestUser, createUniqueDateTime } from '@/test/testUtils';

const MINIMAL_HANJI_DATA: HanjiPuzzleData = {
  width: 1,
  height: 1,
  rowClues: [[0]],
  colClues: [[0]],
  solution: [[0]],
};

async function createTestPuzzle({ dailyChallengeId }: { dailyChallengeId: string }) {
  await prisma.puzzleType.createMany({
    data: {
      name: 'HANJI',
      description: 'HANJI',
      type: 'HANJI',
    },
    skipDuplicates: true,
  });
  return prisma.puzzle.create({
    data: {
      dailyChallengeId,
      data: MINIMAL_HANJI_DATA,
      type: 'HANJI',
    },
  });
}

describe('advertisementRewardVerificationDao', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createAdvertisementRewardVerification', () => {
    it('creates a PUZZLE_HINT verification', async () => {
      const user = await createTestUser();
      const dc = await createTestDailyChallenge({ date: createUniqueDateTime() });
      const puzzle = await createTestPuzzle({ dailyChallengeId: dc.id });
      const uniqueKey = randomUUID();
      const admobTransactionId = randomUUID();
      const expiresAt = new Date(Date.now() + 60_000);

      const row = await createAdvertisementRewardVerification({
        uniqueKey,
        admobTransactionId,
        userId: user.id,
        type: AdvertisementRewardType.PUZZLE_HINT,
        puzzleId: puzzle.id,
        expiresAt,
      });

      expect(row.uniqueKey).toBe(uniqueKey);
      expect(row.admobTransactionId).toBe(admobTransactionId);
      expect(row.userId).toBe(user.id);
      expect(row.puzzleId).toBe(puzzle.id);
      expect(row.type).toBe(AdvertisementRewardType.PUZZLE_HINT);
      expect(row.expiresAt).toEqual(expiresAt);
    });

    it('throws AlreadyExistsError when uniqueKey collides', async () => {
      const user = await createTestUser();
      const dc = await createTestDailyChallenge({ date: createUniqueDateTime() });
      const puzzle = await createTestPuzzle({ dailyChallengeId: dc.id });
      const uniqueKey = randomUUID();
      const expiresAt = new Date(Date.now() + 60_000);

      await createAdvertisementRewardVerification({
        uniqueKey,
        admobTransactionId: randomUUID(),
        userId: user.id,
        type: AdvertisementRewardType.PUZZLE_HINT,
        puzzleId: puzzle.id,
        expiresAt,
      });

      await expect(
        createAdvertisementRewardVerification({
          uniqueKey,
          admobTransactionId: randomUUID(),
          userId: user.id,
          type: AdvertisementRewardType.PUZZLE_HINT,
          puzzleId: puzzle.id,
          expiresAt,
        }),
      ).rejects.toBeInstanceOf(AlreadyExistsError);
    });

    it('throws AlreadyExistsError when admobTransactionId collides', async () => {
      const user = await createTestUser();
      const dc = await createTestDailyChallenge({ date: createUniqueDateTime() });
      const puzzle = await createTestPuzzle({ dailyChallengeId: dc.id });
      const admobTransactionId = randomUUID();
      const expiresAt = new Date(Date.now() + 60_000);

      await createAdvertisementRewardVerification({
        uniqueKey: randomUUID(),
        admobTransactionId,
        userId: user.id,
        type: AdvertisementRewardType.PUZZLE_HINT,
        puzzleId: puzzle.id,
        expiresAt,
      });

      await expect(
        createAdvertisementRewardVerification({
          uniqueKey: randomUUID(),
          admobTransactionId,
          userId: user.id,
          type: AdvertisementRewardType.PUZZLE_HINT,
          puzzleId: puzzle.id,
          expiresAt,
        }),
      ).rejects.toBeInstanceOf(AlreadyExistsError);
    });
  });

  describe('getAdvertisementRewardVerification', () => {
    it('returns the row when valid', async () => {
      const user = await createTestUser();
      const dc = await createTestDailyChallenge({ date: createUniqueDateTime() });
      const puzzle = await createTestPuzzle({ dailyChallengeId: dc.id });
      const uniqueKey = randomUUID();
      const expiresAt = new Date(Date.now() + 120_000);

      const created = await createAdvertisementRewardVerification({
        uniqueKey,
        admobTransactionId: randomUUID(),
        userId: user.id,
        type: AdvertisementRewardType.PUZZLE_HINT,
        puzzleId: puzzle.id,
        expiresAt,
      });

      const result = await getAdvertisementRewardVerification({
        uniqueKey,
        userId: user.id,
        type: AdvertisementRewardType.PUZZLE_HINT,
        puzzleId: puzzle.id,
      });

      expect(result).toEqual(created);
    });

    it('throws NotFoundError when uniqueKey does not exist', async () => {
      await expect(
        getAdvertisementRewardVerification({
          uniqueKey: randomUUID(),
          userId: randomUUID(),
          type: AdvertisementRewardType.PUZZLE_HINT,
          puzzleId: randomUUID(),
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws NotFoundError when userId does not match', async () => {
      const user = await createTestUser();
      const other = await createTestUser();
      const dc = await createTestDailyChallenge({ date: createUniqueDateTime() });
      const puzzle = await createTestPuzzle({ dailyChallengeId: dc.id });
      const uniqueKey = randomUUID();

      await createAdvertisementRewardVerification({
        uniqueKey,
        admobTransactionId: randomUUID(),
        userId: user.id,
        type: AdvertisementRewardType.PUZZLE_HINT,
        puzzleId: puzzle.id,
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        getAdvertisementRewardVerification({
          uniqueKey,
          userId: other.id,
          type: AdvertisementRewardType.PUZZLE_HINT,
          puzzleId: puzzle.id,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws NotFoundError when type does not match', async () => {
      const user = await createTestUser();
      const dc = await createTestDailyChallenge({ date: createUniqueDateTime() });
      const puzzle = await createTestPuzzle({ dailyChallengeId: dc.id });
      const uniqueKey = randomUUID();

      await createAdvertisementRewardVerification({
        uniqueKey,
        admobTransactionId: randomUUID(),
        userId: user.id,
        type: AdvertisementRewardType.PUZZLE_HINT,
        puzzleId: puzzle.id,
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        getAdvertisementRewardVerification({
          uniqueKey,
          userId: user.id,
          // @ts-expect-error - other type is not allowed
          type: 'OTHER_TYPE',
          puzzleId: puzzle.id,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws NotFoundError when puzzleId does not match for PUZZLE_HINT', async () => {
      const user = await createTestUser();
      const dc = await createTestDailyChallenge({ date: createUniqueDateTime() });
      const otherDc = await createTestDailyChallenge({ date: createUniqueDateTime() });
      const puzzle = await createTestPuzzle({ dailyChallengeId: dc.id });
      const otherPuzzle = await createTestPuzzle({ dailyChallengeId: otherDc.id });
      const uniqueKey = randomUUID();

      await createAdvertisementRewardVerification({
        uniqueKey,
        admobTransactionId: randomUUID(),
        userId: user.id,
        type: AdvertisementRewardType.PUZZLE_HINT,
        puzzleId: puzzle.id,
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        getAdvertisementRewardVerification({
          uniqueKey,
          userId: user.id,
          type: AdvertisementRewardType.PUZZLE_HINT,
          puzzleId: otherPuzzle.id,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws NotFoundError when expired', async () => {
      const user = await createTestUser();
      const dc = await createTestDailyChallenge({ date: createUniqueDateTime() });
      const puzzle = await createTestPuzzle({ dailyChallengeId: dc.id });
      const uniqueKey = randomUUID();
      const expiresAt = new Date(Date.now() - 60_000);

      await createAdvertisementRewardVerification({
        uniqueKey,
        admobTransactionId: randomUUID(),
        userId: user.id,
        type: AdvertisementRewardType.PUZZLE_HINT,
        puzzleId: puzzle.id,
        expiresAt,
      });

      await expect(
        getAdvertisementRewardVerification({
          uniqueKey,
          userId: user.id,
          type: AdvertisementRewardType.PUZZLE_HINT,
          puzzleId: puzzle.id,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
