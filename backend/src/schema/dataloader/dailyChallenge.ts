import DataLoader from 'dataloader';

import {
  getCompletedPuzzleCountsByDailyChallengeIds,
  getPuzzleCountsByDailyChallengeIds,
} from '@/platform/dailyChallenge/service/dailyChallengeService';
import { type Authorization } from '@/schema/context/authorization';

export function DailyChallengeDataLoader({ user }: Authorization) {
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

  return {
    dailyChallengePuzzleCount,
    dailyChallengeCompletedPuzzleCount,
  };
}
