import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { FontAwesome } from '@expo/vector-icons';

import { type PuzzleType } from '@/api/puzzle/puzzle';
import { type PuzzleHint } from '@/api/puzzle/puzzleHint';
import {
  type RequestPuzzleHintInput,
  useRequestPuzzleHint,
} from '@/api/puzzle/requestPuzzleHintMutation';
import { Button } from '@/components/common/Button';
import { Text } from '@/components/common/Text';
import { Spacing } from '@/constants/token';
import { useTriggerAd } from '@/hooks/ads/useTriggerAd';
import { useStableCallback } from '@/hooks/useStableCallback';
import { useTheme } from '@/hooks/useTheme';

type HintButtonProps<T extends PuzzleType> = Extract<RequestPuzzleHintInput, { puzzleType: T }> & {
  onHint: (hint: Extract<PuzzleHint, { puzzleType: T }>) => void;
};

export function HintButton<T extends PuzzleType>({ onHint, ...input }: HintButtonProps<T>) {
  const theme = useTheme();
  const { requestPuzzleHint, isLoading, isError } = useRequestPuzzleHint();
  const { isDisabled, isEarnedReward, onPressShowAd } = useTriggerAd();

  const onHintPress = useStableCallback(async () => {
    const hint = await requestPuzzleHint(input);
    onHint(hint as Extract<PuzzleHint, { puzzleType: T }>);
  });

  useEffect(() => {
    if (isEarnedReward) {
      onHintPress();
    }
  }, [isEarnedReward, onHintPress]);

  return (
    <View style={styles.container}>
      <Button
        variant="secondary"
        onPress={onPressShowAd}
        disabled={isLoading || isError || isDisabled}
        leadingIcon={<FontAwesome name="lightbulb-o" size={28} color={theme.accentInk} />}
      >
        Hint
      </Button>
      <Text type="caption">Watch an ad to get a hint</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.one,
  },
});
