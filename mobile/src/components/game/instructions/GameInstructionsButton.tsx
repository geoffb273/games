import { useRouter } from 'expo-router';

import { type PuzzleType } from '@/api/puzzle/puzzle';
import { Button } from '@/components/common/Button';

/**
 * Shared button to enter the instructions screen for a given puzzle type.
 */
export function GameInstructionsButton({ puzzleType }: { puzzleType: PuzzleType }) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      onPress={() =>
        router.push({
          pathname: '/game/[type]/instructions',
          params: { type: puzzleType },
        })
      }
      leadingIcon="question-circle-o"
    />
  );
}
