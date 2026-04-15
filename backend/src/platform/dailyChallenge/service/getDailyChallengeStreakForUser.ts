import { type Logger } from 'pino';

import {
  getDailyChallengeMaxStreakCache,
  updateDailyChallengeMaxStreakCache,
} from '@/cache/dailyChallenge/dailyChallengeStreak';

import {
  getDailyChallengeCurrentStreakForUser,
  getDailyChallengeMaxStreakForUser,
} from '../dao/dailyChallengeDao';
import { type DailyChallengeStreak } from '../resource/dailyChallenge';

export async function getDailyChallengeStreakForUser({
  userId,
  logger,
}: {
  userId: string;
  logger: Logger;
}): Promise<DailyChallengeStreak> {
  const [current, cachedMax] = await Promise.all([
    getDailyChallengeCurrentStreakForUser({ userId }),
    getDailyChallengeMaxStreakCache({ userId, logger }),
  ]);

  if (cachedMax != null) {
    if (current > cachedMax.max) {
      void updateDailyChallengeMaxStreakCache({ userId, max: current });
      return { current, max: current };
    }
    return { current, max: cachedMax.max };
  }

  const max = await getDailyChallengeMaxStreakForUser({ userId });
  void updateDailyChallengeMaxStreakCache({ userId, max });

  return { current, max };
}
