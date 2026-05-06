import { usePuzzlesQuery } from '@/api/puzzle/puzzlesQuery';

import { ShareDailyChallengeCard } from './ShareDailyChallengeCard';
import { ShareResultButton } from './ShareResultButton';

type ShareDailyChallengeButtonProps = {
  dailyChallengeId: string;
};

export function ShareDailyChallengeButton({ dailyChallengeId }: ShareDailyChallengeButtonProps) {
  const { puzzles, isLoading, isError } = usePuzzlesQuery({ dailyChallengeId, cacheOnly: true });

  if (isLoading || isError || puzzles == null) {
    return null;
  }

  const allDailyPuzzlesAttempted =
    puzzles.length > 0 && puzzles.every((dailyPuzzle) => dailyPuzzle.attempt != null);

  if (!allDailyPuzzlesAttempted) {
    return null;
  }

  return (
    <ShareResultButton label="Share complete day" variant="primary" size="lg">
      <ShareDailyChallengeCard puzzles={puzzles} />
    </ShareResultButton>
  );
}
