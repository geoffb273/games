import { memo, useCallback, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/common/Text';
import {
  SUCCESS_COMPLETION_WAVE_DELAY_MS,
  SUCCESS_COMPLETION_WAVE_DURATIONS_MS,
} from '@/components/game/successCompletionTiming';
import { COLOR } from '@/constants/color';
import { useStableCallback } from '@/hooks/useStableCallback';
import { useTheme } from '@/hooks/useTheme';
import type { HanjiCellState } from '@/utils/hanji/lineValidation';

type HanjiCellProps = {
  row: number;
  col: number;
  size: number;
  state: HanjiCellState;
  onTap: (row: number, col: number) => void;
  onLongPress: (row: number, col: number) => void;
  isDisabled?: boolean;
  isCompletionWaveActive?: boolean;
  /** Whether this cell is the last in the wave. If so, it will notify call `onWaveComplete` when the animation is complete. */
  isLastInWave: boolean;
  /** Callback to call when the animation is complete. Only called if `isLastInWave` is true. */
  onWaveComplete?: () => void;
};

export const HanjiCell = memo(function HanjiCell({
  row,
  col,
  size,
  state,
  onTap,
  onLongPress,
  isDisabled = false,
  isCompletionWaveActive = false,
  isLastInWave = false,
  onWaveComplete,
}: HanjiCellProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const stableOnWaveComplete = useStableCallback(() => onWaveComplete?.());

  // Completion scale animation: each filled cell scales in sequence. Last cell notifies parent when done.
  useEffect(() => {
    if (!isCompletionWaveActive || state !== 'filled') return;

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
  }, [col, isLastInWave, stableOnWaveComplete, row, scale, state, isCompletionWaveActive]);

  const handleTap = useCallback(() => {
    onTap(row, col);
  }, [onTap, row, col]);

  const handleLongPress = useCallback(() => {
    onLongPress(row, col);
  }, [onLongPress, row, col]);

  const tap = Gesture.Tap()
    .withTestId('hanji-cell-tap')
    .enabled(!isDisabled)
    .onBegin(() => {
      'worklet';
      scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    })
    .onEnd(() => {
      'worklet';
      runOnJS(handleTap)();
    })
    .onFinalize(() => {
      'worklet';
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    });

  const longPressGesture = Gesture.LongPress()
    .withTestId('hanji-cell-longpress')
    .minDuration(350)
    .enabled(!isDisabled)
    .onStart(() => {
      'worklet';
      scale.value = withSequence(
        withTiming(0.85, { duration: 60 }),
        withSpring(1, { damping: 12 }),
      );
      runOnJS(handleLongPress)();
    });

  const gesture = Gesture.Exclusive(longPressGesture, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bg =
    state === 'filled'
      ? theme.text
      : state === 'marked'
        ? theme.backgroundSelected
        : theme.backgroundElement;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.cell,
          {
            width: size,
            height: size,
            borderRadius: size > 36 ? 6 : 4,
            backgroundColor: bg,
          },
          state === 'empty' && styles.cellRaised,
          animatedStyle,
        ]}
      >
        {state === 'marked' ? (
          <Text type="caption" color="textSecondary">
            ✕
          </Text>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellRaised: {
    shadowColor: COLOR.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
});
