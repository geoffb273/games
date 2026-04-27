import DataLoader from 'dataloader';

import { type DailyChallenge } from '@/platform/dailyChallenge/resource/dailyChallenge';
import {
  getCompletedPuzzleCountsByDailyChallengeIds,
  getDailyChallengesByIds,
  getPuzzleCountsByDailyChallengeIds,
} from '@/platform/dailyChallenge/service/dailyChallengeService';

import { type Context } from '../context/context';

export function DailyChallengeDataLoader({
  authorization: { user },
}: Omit<Context, 'dataloaders'>) {
  const dailyChallengePuzzleCount = new DataLoader<string, number>(async (dailyChallengeIds) => {
    const map = await getPuzzleCountsByDailyChallengeIds({ dailyChallengeIds });
    return dailyChallengeIds.map((id) => map.get(id) ?? 0);
  });

  const dailyChallengeCompletedPuzzleCount = new DataLoader<string, number>(
    async (dailyChallengeIds) => {
      const resolvedUser = await user;

      if (resolvedUser == null) return dailyChallengeIds.map(() => 0);

      const map = await getCompletedPuzzleCountsByDailyChallengeIds({
        dailyChallengeIds,
        userId: resolvedUser.id,
      });
      return dailyChallengeIds.map((id) => map.get(id) ?? 0);
    },
  );

  const dailyChallengeById = new DataLoader<string, DailyChallenge | null>(
    async (dailyChallengeIds) => {
      const map = await getDailyChallengesByIds({ dailyChallengeIds });
      return dailyChallengeIds.map((id) => map.get(id) ?? null);
    },
  );

  return {
    dailyChallengePuzzleCount,
    dailyChallengeCompletedPuzzleCount,
    dailyChallengeById,
  };
}
