import { memo, useCallback } from 'react';
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
import { COLOR, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type CellProps = {
  row: number;
  col: number;
  size: number;
  isRevealed: boolean;
  isFlagged: boolean;
  value: number | null;
  onTap: (row: number, col: number) => void;
  onLongPress: (row: number, col: number) => void;
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
}: CellProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const handleTap = useCallback(() => {
    onTap(row, col);
  }, [onTap, row, col]);

  const handleLongPress = useCallback(() => {
    onLongPress(row, col);
  }, [onLongPress, row, col]);

  const tap = Gesture.Tap()
    .enabled(!isRevealed)
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
    .enabled(!isRevealed)
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
          <Animated.View entering={FadeIn.duration(200).delay(Math.min(20 * (row + col), 600))}>
            <Text
              _colorOverride={
                (value != null
                  ? COLOR.minesweeper.numbers[value as keyof typeof COLOR.minesweeper.numbers]
                  : undefined) ?? theme.text
              }
              size="lg"
            >
              {value}
            </Text>
          </Animated.View>
        ) : isFlagged ? (
          <Animated.View entering={ZoomIn.duration(200)}>
            <Text color="error" size="lg">
              ▲
            </Text>
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
    color: COLOR.minesweeper.flag,
  },
});
