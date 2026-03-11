import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

import { type PuzzleType } from '@/api/puzzle/puzzle';
import { Button } from '@/components/common/Button';
import { useTheme } from '@/hooks/useTheme';

/**
 * Shared button to enter the instructions screen for a given puzzle type.
 */
export function GameInstructionsButton({ puzzleType }: { puzzleType: PuzzleType }) {
  const theme = useTheme();
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
      leadingIcon={<FontAwesome name="question-circle-o" size={28} color={theme.accentInk} />}
    />
  );
}
