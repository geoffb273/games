import DataLoader from 'dataloader';

import {
  type PuzzleAttemptSpeedPercentageKey,
  type UserPuzzleAttempt,
} from '@/platform/puzzle/resource/userPuzzleAttempt';
import {
  getPuzzleAttemptSpeedPercentages,
  getUserPuzzleAttemptsByPuzzleIds,
} from '@/platform/puzzle/service/puzzleService';
import { type Authorization } from '@/schema/context/authorization';
import { serializePuzzleAttemptSpeedPercentageKey } from '@/utils/puzzle/attemptUtil';

export function PuzzleDataLoader({ user }: Authorization) {
  const userPuzzleAttempt = new DataLoader<string, UserPuzzleAttempt | null>(async (puzzleIds) => {
    const resolvedUser = await user;

    if (resolvedUser == null) return puzzleIds.map(() => null);

    const map = await getUserPuzzleAttemptsByPuzzleIds({
      userId: resolvedUser.id,
      puzzleIds,
    });
    return puzzleIds.map((id) => map.get(id) ?? null);
  });

  const puzzleAttemptSpeedPercentage = new DataLoader<
    PuzzleAttemptSpeedPercentageKey,
    number,
    string
  >(
    async (keys) => {
      const map = await getPuzzleAttemptSpeedPercentages({ keys });
      return keys.map((key) => map.get(serializePuzzleAttemptSpeedPercentageKey(key)) ?? 0);
    },
    {
      cacheKeyFn: (key) => serializePuzzleAttemptSpeedPercentageKey(key),
    },
  );

  return {
    puzzleAttemptSpeedPercentage,
    userPuzzleAttempt,
  };
}
