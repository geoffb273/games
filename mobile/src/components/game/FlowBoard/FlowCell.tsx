import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/common/Text';
import { COLOR } from '@/constants/color';
import {
  SUCCESS_COMPLETION_WAVE_DELAY_MS,
  SUCCESS_COMPLETION_WAVE_DURATIONS_MS,
} from '@/components/game/successCompletionTiming';
import { useStableCallback } from '@/hooks/useStableCallback';
import { useTheme } from '@/hooks/useTheme';
import { useColorBlindEnabled } from '@/store/colorBlindStore';

type FlowCellProps = {
  size: number;
  pairNumber: number | null;
  cellValue: number;
  color: string;
  row: number;
  col: number;
  isCompletionWaveActive?: boolean;
  isLastInWave?: boolean;
  onWaveComplete?: () => void;
};

export function FlowCell({
  size,
  pairNumber,
  cellValue,
  color,
  row,
  col,
  isCompletionWaveActive = false,
  isLastInWave = false,
  onWaveComplete,
}: FlowCellProps) {
  const theme = useTheme();
  const isColorBlind = useColorBlindEnabled();
  const isFilled = cellValue > 0;
  const backgroundColor = isFilled ? color : theme.backgroundElement;
  const showEndpoint = pairNumber != null;

  const numberToShow = pairNumber ?? cellValue;

  const showNumber = (isColorBlind || showEndpoint) && numberToShow > 0;

  const scale = useSharedValue(1);
  const stableOnWaveComplete = useStableCallback(() => onWaveComplete?.());

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (!isCompletionWaveActive) return;
    const notifyComplete = isLastInWave
      ? (finished?: boolean) => {
          'worklet';
          if (finished) runOnJS(stableOnWaveComplete)();
        }
      : undefined;

    scale.value = withSequence(
      withTiming(1, { duration: (row + col) * SUCCESS_COMPLETION_WAVE_DELAY_MS }),
      withTiming(1.1, { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.firstPulse }),
      withTiming(0.95, { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.settle }),
      withTiming(1.15, { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.bounce }),
      withTiming(1, { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.finalSettle }, notifyComplete),
    );
  }, [isCompletionWaveActive, row, col, scale, isLastInWave, stableOnWaveComplete]);

  return (
    <Animated.View
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor,
          borderColor: theme.borderSubtle,
          borderWidth: 1,
        },
        showEndpoint && { backgroundColor: color },
        animatedStyle,
      ]}
    >
      {showNumber && (
        <Text type="emphasized_body" _colorOverride={COLOR.white}>
          {numberToShow}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
