import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getDailyChallengeMaxStreakCache,
  updateDailyChallengeMaxStreakCache,
} from '@/cache/dailyChallenge/dailyChallengeStreak';
import {
  getDailyChallengeCurrentStreakForUser,
  getDailyChallengeMaxStreakForUser,
} from '@/platform/dailyChallenge/dao/dailyChallengeDao';
import { getDailyChallengeStreakForUser } from '@/platform/dailyChallenge/service/getDailyChallengeStreakForUser';
import { createMockLogger } from '@/test/testUtils';

vi.mock('@/cache/dailyChallenge/dailyChallengeStreak');
vi.mock('@/platform/dailyChallenge/dao/dailyChallengeDao');

describe('getDailyChallengeStreakForUser', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns cached max streak when cache is present and current does not exceed it', async () => {
    const userId = randomUUID();
    const logger = createMockLogger();
    vi.mocked(getDailyChallengeCurrentStreakForUser).mockResolvedValue(3);
    vi.mocked(getDailyChallengeMaxStreakCache).mockResolvedValue({
      max: 5,
    });

    const result = await getDailyChallengeStreakForUser({ userId, logger });

    expect(getDailyChallengeCurrentStreakForUser).toHaveBeenCalledWith({ userId });
    expect(getDailyChallengeMaxStreakCache).toHaveBeenCalledWith({ userId, logger });
    expect(getDailyChallengeMaxStreakForUser).not.toHaveBeenCalled();
    expect(updateDailyChallengeMaxStreakCache).not.toHaveBeenCalled();
    expect(result).toEqual({ current: 3, max: 5 });
  });

  it('updates cache and returns current streak as max when current exceeds cached max', async () => {
    const userId = randomUUID();
    const logger = createMockLogger();
    vi.mocked(getDailyChallengeCurrentStreakForUser).mockResolvedValue(7);
    vi.mocked(getDailyChallengeMaxStreakCache).mockResolvedValue({
      max: 6,
    });

    const result = await getDailyChallengeStreakForUser({ userId, logger });

    expect(getDailyChallengeMaxStreakForUser).not.toHaveBeenCalled();
    expect(updateDailyChallengeMaxStreakCache).toHaveBeenCalledWith({ userId, max: 7 });
    expect(result).toEqual({ current: 7, max: 7 });
  });

  it('loads max streak from dao when cache miss and writes it to cache', async () => {
    const userId = randomUUID();
    const logger = createMockLogger();
    vi.mocked(getDailyChallengeCurrentStreakForUser).mockResolvedValue(2);
    vi.mocked(getDailyChallengeMaxStreakCache).mockResolvedValue(null);
    vi.mocked(getDailyChallengeMaxStreakForUser).mockResolvedValue(4);

    const result = await getDailyChallengeStreakForUser({ userId, logger });

    expect(getDailyChallengeMaxStreakForUser).toHaveBeenCalledWith({ userId });
    expect(updateDailyChallengeMaxStreakCache).toHaveBeenCalledWith({ userId, max: 4 });
    expect(result).toEqual({ current: 2, max: 4 });
  });
});
