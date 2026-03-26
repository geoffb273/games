import DataLoader from 'dataloader';

import {
  type PuzzleAttemptSpeedPercentageKey,
  type UserPuzzleAttempt,
} from '@/platform/puzzle/resource/userPuzzleAttempt';
import {
  getPuzzleAttemptSpeedPercentages,
  getUserPuzzleAttemptsByPuzzleIds,
} from '@/platform/puzzle/service/puzzleService';
import { serializePuzzleAttemptSpeedPercentageKey } from '@/utils/puzzle/attemptUtil';

import { type Context } from '../context/context';

export function PuzzleDataLoader({
  authorization: { user },
  logger,
}: Omit<Context, 'dataloaders'>) {
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
      const userId = (await user)?.id ?? null;
      if (userId == null) return keys.map(() => 0);

      const map = await getPuzzleAttemptSpeedPercentages({ userId, keys, logger });
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
