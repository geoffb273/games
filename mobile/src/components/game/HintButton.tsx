import { FontAwesome } from '@expo/vector-icons';

import { type PuzzleType } from '@/api/puzzle/puzzle';
import { type PuzzleHint } from '@/api/puzzle/puzzleHint';
import {
  type RequestPuzzleHintInput,
  useRequestPuzzleHint,
} from '@/api/puzzle/requestPuzzleHintMutation';
import { Button } from '@/components/common/Button';
import { useStableCallback } from '@/hooks/useStableCallback';
import { useTheme } from '@/hooks/useTheme';

type HintButtonProps<T extends PuzzleType> = Extract<RequestPuzzleHintInput, { puzzleType: T }> & {
  onHint: (hint: Extract<PuzzleHint, { puzzleType: T }>) => void;
};

export function HintButton<T extends PuzzleType>({ onHint, ...input }: HintButtonProps<T>) {
  const theme = useTheme();
  const { requestPuzzleHint, isLoading, isError } = useRequestPuzzleHint();

  const onHintPress = useStableCallback(async () => {
    const hint = await requestPuzzleHint(input);
    onHint(hint as Extract<PuzzleHint, { puzzleType: T }>);
  });

  return (
    <Button
      variant="secondary"
      onPress={onHintPress}
      disabled={isLoading || isError}
      leadingIcon={<FontAwesome name="lightbulb-o" size={28} color={theme.accentInk} />}
    >
      Hint
    </Button>
  );
}
