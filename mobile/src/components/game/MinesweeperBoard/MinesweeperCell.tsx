import { memo, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { Text } from '@/components/common/Text';
import { COLOR } from '@/constants/color';
import { Spacing } from '@/constants/token';
import {
  SUCCESS_COMPLETION_WAVE_DELAY_MS,
  SUCCESS_COMPLETION_WAVE_DURATIONS_MS,
} from '@/components/game/successCompletionTiming';
import { useStableCallback } from '@/hooks/useStableCallback';
import { useTheme } from '@/hooks/useTheme';

import { MinesweeperColors } from './minesweeperColor';

type CellProps = {
  row: number;
  col: number;
  size: number;
  isRevealed: boolean;
  isFlagged: boolean;
  value: number | null;
  onTap: (row: number, col: number) => void;
  onLongPress: (row: number, col: number) => void;
  isCompletionAnimationActive?: boolean;
  completionAnimationType?: 'wave' | 'explosion';
  /** Whether this cell is the last in the completion wave. */
  isLastInWave?: boolean;
  /** Called when the completion wave finishes (only triggered from the last cell). */
  onWaveComplete?: () => void;
  isDisabled?: boolean;
};

export const MinesweeperCell = memo(function MinesweeperCell({
  row,
  col,
  size,
  isRevealed,
  isFlagged,
  value,
  onTap,
  onLongPress,
  isCompletionAnimationActive = false,
  completionAnimationType = 'explosion',
  isLastInWave = false,
  onWaveComplete,
  isDisabled = false,
}: CellProps) {
  const { width, height } = useWindowDimensions();
  const theme = useTheme();
  const scale = useSharedValue(1);
  const translate = useSharedValue(0);
  const stableOnWaveComplete = useStableCallback(() => onWaveComplete?.());

  const directions = useMemo(() => {
    const yDirection = (Math.random() - 0.5) * 2;
    const xDirection = (Math.random() - 0.5) * 2;
    return { x: xDirection, y: yDirection };
  }, []);

  const handleTap = useCallback(() => {
    onTap(row, col);
  }, [onTap, row, col]);

  const handleLongPress = useCallback(() => {
    onLongPress(row, col);
  }, [onLongPress, row, col]);

  // Completion wave animation: sequentially scales all cells on a win.
  useEffect(() => {
    if (!isCompletionAnimationActive) return;

    const notifyComplete = isLastInWave
      ? (finished?: boolean) => {
          'worklet';
          if (finished) runOnJS(stableOnWaveComplete)();
        }
      : undefined;

    if (completionAnimationType === 'wave') {
      scale.value = withSequence(
        withTiming(1, { duration: (row + col) * SUCCESS_COMPLETION_WAVE_DELAY_MS }),
        withTiming(1.1, { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.firstPulse }),
        withTiming(0.95, { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.settle }),
        withTiming(1.25, { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.bounce }),
        withTiming(1, { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.finalSettle }, notifyComplete),
      );
    } else {
      translate.value = withTiming(
        1,
        { duration: 2000, easing: Easing.out(Easing.exp) },
        notifyComplete,
      );
    }
  }, [
    col,
    completionAnimationType,
    isCompletionAnimationActive,
    isLastInWave,
    row,
    scale,
    stableOnWaveComplete,
    translate,
  ]);

  const tap = Gesture.Tap()
    .withTestId('minesweeper-cell-tap')
    .enabled(!isRevealed && !isDisabled)
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
    .withTestId('minesweeper-cell-longpress')
    .enabled(!isRevealed && !isDisabled)
    .minDuration(300)
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
    transform: [
      { scale: scale.value },
      { translateX: translate.value * directions.x * width },
      { translateY: translate.value * directions.y * height },
    ],
  }));

  const innerAnimatedStyle = useAnimatedStyle(() => ({
    transform: isCompletionAnimationActive ? [{ scale: scale.value }] : [{ scale: 1 }],
  }));

  const bg = isRevealed
    ? theme.background
    : isFlagged
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
          !isRevealed && styles.cellRaised,
          animatedStyle,
        ]}
      >
        {isRevealed && value != null && value > 0 ? (
          <Animated.View
            entering={FadeIn.duration(200).delay(Math.min(20 * (row + col), 600))}
            style={innerAnimatedStyle}
          >
            <Text
              _colorOverride={
                (value != null
                  ? MinesweeperColors.numbers[value as keyof typeof MinesweeperColors.numbers]
                  : undefined) ?? theme.text
              }
              size="lg"
            >
              {value}
            </Text>
          </Animated.View>
        ) : isFlagged ? (
          <Animated.View entering={ZoomIn.duration(200)}>
            <Animated.View style={innerAnimatedStyle}>
              <Text color="error" size="lg">
                ▲
              </Text>
            </Animated.View>
          </Animated.View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.four,
    paddingTop: Spacing.four,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  toolbarItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  board: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
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
  cellNumber: {
    fontWeight: '700',
    fontFamily: 'ui-rounded',
  },
  flagMarker: {
    fontWeight: '800',
    color: MinesweeperColors.flag,
  },
});
