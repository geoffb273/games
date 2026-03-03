import DataLoader from 'dataloader';

import { type UserPuzzleAttempt } from '@/platform/puzzle/resource/userPuzzleAttempt';
import { getUserPuzzleAttemptsByPuzzleIds } from '@/platform/puzzle/service/puzzleService';
import { type Authorization } from '@/schema/context/authorization';

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

  return {
    userPuzzleAttempt,
  };
}
