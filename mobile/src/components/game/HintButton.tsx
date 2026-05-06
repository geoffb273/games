import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { type PuzzleType } from '@/api/puzzle/puzzle';
import { type PuzzleHint } from '@/api/puzzle/puzzleHint';
import {
  type RequestPuzzleHintInput,
  useRequestPuzzleHint,
} from '@/api/puzzle/requestPuzzleHintMutation';
import { Button } from '@/components/common/Button';
import { Text } from '@/components/common/Text';
import { Spacing } from '@/constants/token';
import { usePlaytimeClockContext } from '@/context/PlaytimeClockContext';
import { useTriggerAd } from '@/hooks/ads/useTriggerAd';
import { useStableCallback } from '@/hooks/useStableCallback';

type HintButtonProps<T extends PuzzleType> = Extract<RequestPuzzleHintInput, { puzzleType: T }> & {
  onHint: (hint: Extract<PuzzleHint, { puzzleType: T }>) => void;
};

export function HintButton<T extends PuzzleType>({ onHint, ...input }: HintButtonProps<T>) {
  const { pause, resume } = usePlaytimeClockContext();
  const { requestPuzzleHint, isLoading, isError } = useRequestPuzzleHint();
  const onFullscreenPresentedChange = useStableCallback((isPresented: boolean) => {
    if (isPresented) {
      pause();
    } else {
      resume();
    }
  });
  const { isDisabled, isEarnedReward, onPressShowAd, generateNewUniqueKey, uniqueKey } =
    useTriggerAd({
      puzzleId: input.puzzleId,
      onFullscreenPresentedChange,
    });

  const onHintPress = useStableCallback(async () => {
    const hint = await requestPuzzleHint({ ...input, uniqueKey });
    onHint(hint as Extract<PuzzleHint, { puzzleType: T }>);
    generateNewUniqueKey();
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
        leadingIcon="lightbulb-o"
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
