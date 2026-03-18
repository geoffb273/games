import { memo, useCallback, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
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
  isCompletionWaveActive?: boolean;
  /** Whether this cell is the last in the completion wave. */
  isLastInWave?: boolean;
  /** Called when the completion wave finishes (only triggered from the last cell). */
  onWaveComplete?: () => void;
  isDisabled?: boolean;
};

const COMPLETION_WAVE_DELAY_MS = 50;

export const MinesweeperCell = memo(function MinesweeperCell({
  row,
  col,
  size,
  isRevealed,
  isFlagged,
  value,
  onTap,
  onLongPress,
  isCompletionWaveActive = false,
  isLastInWave = false,
  onWaveComplete,
  isDisabled = false,
}: CellProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const stableOnWaveComplete = useStableCallback(() => onWaveComplete?.());

  const handleTap = useCallback(() => {
    onTap(row, col);
  }, [onTap, row, col]);

  const handleLongPress = useCallback(() => {
    onLongPress(row, col);
  }, [onLongPress, row, col]);

  // Completion wave animation: sequentially scales all cells on a win.
  useEffect(() => {
    if (!isCompletionWaveActive) return;

    const notifyComplete = isLastInWave
      ? (finished?: boolean) => {
          'worklet';
          if (finished) runOnJS(stableOnWaveComplete)();
        }
      : undefined;

    scale.value = withSequence(
      withTiming(1, { duration: (row + col) * COMPLETION_WAVE_DELAY_MS }),
      withTiming(1.1, { duration: 300 }),
      withTiming(0.95, { duration: 200 }),
      withTiming(1.25, { duration: 400 }),
      withTiming(1, { duration: 400 }, notifyComplete),
    );
  }, [col, isCompletionWaveActive, isLastInWave, row, scale, stableOnWaveComplete]);

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
    transform: [{ scale: scale.value }],
  }));

  const innerAnimatedStyle = useAnimatedStyle(() => ({
    transform: isCompletionWaveActive ? [{ scale: scale.value }] : [{ scale: 1 }],
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
