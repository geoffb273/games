import { memo, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { FontAwesome } from '@expo/vector-icons';

import { Text } from '@/components/common/Text';
import {
  SUCCESS_COMPLETION_WAVE_DELAY_MS,
  SUCCESS_COMPLETION_WAVE_DURATIONS_MS,
} from '@/components/game/successCompletionTiming';
import { COLOR } from '@/constants/color';
import { Spacing } from '@/constants/token';
import { useStableCallback } from '@/hooks/useStableCallback';
import { useTheme } from '@/hooks/useTheme';

import { MinesweeperColors } from './minesweeperColor';

export const LOSS_REVEAL_DURATION_MS = 2_000;
const LOSS_REVEAL_PULSE_COUNT = 1;

type CellProps = {
  row: number;
  col: number;
  size: number;
  isRevealed: boolean;
  isFlagged: boolean;
  isHintedFlag?: boolean;
  value: number | null;
  isMine: boolean;
  isTriggeredMine: boolean;
  onTap: (row: number, col: number) => void;
  onLongPress: (row: number, col: number) => void;
  isCompletionAnimationActive?: boolean;
  completionAnimationType?: 'wave' | 'explosion';
  isLossRevealActive?: boolean;
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
  isHintedFlag = false,
  value,
  isMine,
  isTriggeredMine,
  onTap,
  onLongPress,
  isCompletionAnimationActive = false,
  completionAnimationType = 'explosion',
  isLossRevealActive = false,
  isLastInWave = false,
  onWaveComplete,
  isDisabled = false,
}: CellProps) {
  const { width, height } = useWindowDimensions();
  const theme = useTheme();
  const scale = useSharedValue(1);
  const translate = useSharedValue(0);
  const opacity = useSharedValue(1);
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
        withTiming(
          1,
          { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.finalSettle },
          notifyComplete,
        ),
      );
    } else {
      translate.value = withSequence(
        withTiming(0, { duration: LOSS_REVEAL_DURATION_MS }, () => {
          'worklet';
          opacity.value = 0;
        }),
        withTiming(1, { duration: 2000, easing: Easing.out(Easing.exp) }, notifyComplete),
      );
    }
  }, [
    col,
    completionAnimationType,
    isCompletionAnimationActive,
    isLastInWave,
    opacity,
    row,
    scale,
    stableOnWaveComplete,
    translate,
  ]);

  useEffect(() => {
    if (!isLossRevealActive || !isTriggeredMine) return;

    // If the mine was just tapped, a gesture spring may still be running on scale.
    cancelAnimation(scale);

    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, {
          duration: LOSS_REVEAL_DURATION_MS / (4 * LOSS_REVEAL_PULSE_COUNT),
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0.98, {
          duration: LOSS_REVEAL_DURATION_MS / (4 * LOSS_REVEAL_PULSE_COUNT),
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(1.08, {
          duration: LOSS_REVEAL_DURATION_MS / (4 * LOSS_REVEAL_PULSE_COUNT),
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(1, {
          duration: LOSS_REVEAL_DURATION_MS / (4 * LOSS_REVEAL_PULSE_COUNT),
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      LOSS_REVEAL_PULSE_COUNT,
      false,
    );
  }, [isLossRevealActive, isTriggeredMine, scale]);

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
    opacity: isTriggeredMine ? opacity.value : 1,
  }));

  const bg =
    isRevealed || isTriggeredMine
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
          !isRevealed && !isTriggeredMine && styles.cellRaised,
          animatedStyle,
        ]}
      >
        <MinesweeperCellContent
          row={row}
          col={col}
          scale={scale}
          isCompletionAnimationActive={isCompletionAnimationActive}
          isTriggeredMine={isTriggeredMine}
          isRevealed={isRevealed}
          isMine={isMine}
          value={value}
          isFlagged={isFlagged}
          isHintedFlag={isHintedFlag}
        />
      </Animated.View>
    </GestureDetector>
  );
});

type MinesweeperCellContentProps = {
  row: number;
  col: number;
  scale: SharedValue<number>;
  isCompletionAnimationActive: boolean;
  isTriggeredMine: boolean;
  isRevealed: boolean;
  isMine: boolean;
  value: number | null;
  isFlagged: boolean;
  isHintedFlag: boolean;
};

const MinesweeperCellContent = memo(function MinesweeperCellContent({
  row,
  col,
  scale,
  isCompletionAnimationActive,
  isTriggeredMine,
  isRevealed,
  isMine,
  value,
  isFlagged,
  isHintedFlag,
}: MinesweeperCellContentProps) {
  const theme = useTheme();
  const innerAnimatedStyle = useAnimatedStyle(() => ({
    transform: isCompletionAnimationActive ? [{ scale: scale.value }] : [{ scale: 1 }],
  }));

  const shouldShowMine = isTriggeredMine || (isRevealed && isMine);
  const shouldShowValue = isRevealed && value != null && value > 0;

  const valueEnteringAnimation = useMemo(() => {
    return FadeIn.duration(200).delay(Math.min(20 * (row + col), 600));
  }, [row, col]);

  if (shouldShowMine) {
    return (
      <Animated.View entering={isRevealed ? undefined : ZoomIn.duration(120)}>
        <Animated.View style={innerAnimatedStyle}>
          <Text color="error" size="lg">
            💣
          </Text>
        </Animated.View>
      </Animated.View>
    );
  }

  if (shouldShowValue) {
    return (
      <Animated.View
        entering={isRevealed ? undefined : valueEnteringAnimation}
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
    );
  }

  if (!isFlagged) return null;

  return (
    <Animated.View entering={isRevealed ? undefined : ZoomIn.duration(200)}>
      <Animated.View style={innerAnimatedStyle}>
        {isHintedFlag ? (
          <FontAwesome
            name="lock"
            size={18}
            color={MinesweeperColors.flag}
            testID="minesweeper-hinted-flag-icon"
          />
        ) : (
          <Text color="error" size="lg">
            ▲
          </Text>
        )}
      </Animated.View>
    </Animated.View>
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
