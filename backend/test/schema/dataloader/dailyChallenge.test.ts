import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getCompletedPuzzleCountsByDailyChallengeIds,
  getDailyChallengesByIds,
  getPuzzleCountsByDailyChallengeIds,
} from '@/platform/dailyChallenge/service/dailyChallengeService';
import { type User } from '@/platform/user/resource/user';
import { DailyChallengeDataLoader } from '@/schema/dataloader/dailyChallenge';
import { UnauthorizedError } from '@/schema/errors';
import { createMockLogger } from '@/test/testUtils';
import { lazy } from '@/utils/LazyPromise';

vi.mock('@/platform/dailyChallenge/service/dailyChallengeService');

function minimalDailyChallenge(id: string) {
  const now = new Date();
  return { id, date: now, createdAt: now, updatedAt: now };
}

function loaderForUser(user: User | null) {
  return DailyChallengeDataLoader({
    authorization: {
      isAdmin: false,
      user: Promise.resolve(user),
      expectUser: user
        ? lazy<User>(async () => user)
        : lazy<User>(async () => {
            throw new UnauthorizedError('No token provided');
          }),
    },
    logger: createMockLogger(),
  });
}

describe('DailyChallengeDataLoader', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('dailyChallengePuzzleCount', () => {
    it('batches loads into one service call and maps missing ids to 0', async () => {
      const id1 = randomUUID();
      const id2 = randomUUID();
      vi.mocked(getPuzzleCountsByDailyChallengeIds).mockResolvedValue(new Map([[id1, 4]]));

      const { dailyChallengePuzzleCount } = loaderForUser(null);
      const [first, second] = await Promise.all([
        dailyChallengePuzzleCount.load(id1),
        dailyChallengePuzzleCount.load(id2),
      ]);

      expect(getPuzzleCountsByDailyChallengeIds).toHaveBeenCalledTimes(1);
      expect(getPuzzleCountsByDailyChallengeIds).toHaveBeenCalledWith({
        dailyChallengeIds: expect.arrayContaining([id1, id2]),
      });
      expect(first).toBe(4);
      expect(second).toBe(0);
    });
  });

  describe('dailyChallengeById', () => {
    it('returns results in request order and null when an id is absent', async () => {
      const idPresent = randomUUID();
      const idMissing = randomUUID();
      const dc = minimalDailyChallenge(idPresent);
      vi.mocked(getDailyChallengesByIds).mockResolvedValue(new Map([[idPresent, dc]]));

      const { dailyChallengeById } = loaderForUser(null);
      const row = await dailyChallengeById.loadMany([idMissing, idPresent]);

      expect(getDailyChallengesByIds).toHaveBeenCalledTimes(1);
      expect(row[0]).toBeNull();
      expect(row[1]).toEqual(dc);
    });
  });

  describe('dailyChallengeCompletedPuzzleCount', () => {
    it('returns zero without calling the service when there is no authenticated user', async () => {
      const id = randomUUID();
      const { dailyChallengeCompletedPuzzleCount } = loaderForUser(null);

      await expect(dailyChallengeCompletedPuzzleCount.load(id)).resolves.toBe(0);

      expect(getCompletedPuzzleCountsByDailyChallengeIds).not.toHaveBeenCalled();
    });

    it('loads counts from the service for the signed-in user', async () => {
      const userId = randomUUID();
      const user: User = { id: userId, deviceId: 'device' };
      const dcId = randomUUID();
      vi.mocked(getCompletedPuzzleCountsByDailyChallengeIds).mockResolvedValue(
        new Map([[dcId, 2]]),
      );

      const { dailyChallengeCompletedPuzzleCount } = loaderForUser(user);

      await expect(dailyChallengeCompletedPuzzleCount.load(dcId)).resolves.toBe(2);

      expect(getCompletedPuzzleCountsByDailyChallengeIds).toHaveBeenCalledWith({
        dailyChallengeIds: [dcId],
        userId,
      });
    });
  });
});
