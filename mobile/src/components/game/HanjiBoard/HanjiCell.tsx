import { memo, useCallback } from 'react';
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
import { COLOR } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { HanjiCellState } from '@/utils/hanji/lineValidation';

type HanjiCellProps = {
  row: number;
  col: number;
  size: number;
  state: HanjiCellState;
  onTap: (row: number, col: number) => void;
  onLongPress: (row: number, col: number) => void;
};

export const HanjiCell = memo(function HanjiCell({
  row,
  col,
  size,
  state,
  onTap,
  onLongPress,
}: HanjiCellProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const handleTap = useCallback(() => {
    onTap(row, col);
  }, [onTap, row, col]);

  const handleLongPress = useCallback(() => {
    onLongPress(row, col);
  }, [onLongPress, row, col]);

  const tap = Gesture.Tap()
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
    .minDuration(350)
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
  marked: {
    fontWeight: '700',
  },
});
