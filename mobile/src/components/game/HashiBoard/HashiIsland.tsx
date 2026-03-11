import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/common/Text';
import { useTheme } from '@/hooks/useTheme';

const ISLAND_RADIUS_RATIO = 0.4;
const COLOR_ANIMATION_DURATION = 200;

export type HashiIslandProps = {
  requiredBridges: number;
  currentBridges: number;
  x: number;
  y: number;
  cellSize: number;
};

export const HashiIsland = memo(function HashiIsland({
  requiredBridges,
  currentBridges,
  x,
  y,
  cellSize,
}: HashiIslandProps) {
  const theme = useTheme();
  const radius = cellSize * ISLAND_RADIUS_RATIO;
  const isAtMax = currentBridges >= requiredBridges;
  const isOverMax = currentBridges > requiredBridges;

  const backgroundProgress = useSharedValue(isAtMax ? 1 : 0);
  const borderColorProgress = useSharedValue(isOverMax ? 1 : 0);
  const shakeProgress = useSharedValue(0);
  const scaleProgress = useSharedValue(1);

  useEffect(() => {
    backgroundProgress.value = withTiming(isAtMax ? 1 : 0, {
      duration: COLOR_ANIMATION_DURATION,
    });
  }, [backgroundProgress, isAtMax]);

  useEffect(() => {
    const value = isOverMax ? 1 : isAtMax ? 0.5 : 0;
    borderColorProgress.value = withTiming(value, {
      duration: COLOR_ANIMATION_DURATION,
    });
  }, [borderColorProgress, isOverMax, isAtMax]);

  useEffect(() => {
    if (!isOverMax) {
      shakeProgress.value = 0;
      scaleProgress.value = 1;
      return;
    }

    shakeProgress.value = withSequence(
      withTiming(-2, { duration: 40 }),
      withTiming(2, { duration: 40 }),
      withTiming(-1.5, { duration: 40 }),
      withTiming(1.5, { duration: 40 }),
      withTiming(0, { duration: 40 }),
    );

    scaleProgress.value = withTiming(1.1);
  }, [isOverMax, scaleProgress, shakeProgress]);

  const animatedIslandStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      backgroundProgress.value,
      [0, 1],
      [theme.background, theme.text],
    ),
    borderColor: interpolateColor(
      borderColorProgress.value,
      [0, 0.5, 1],
      [theme.text, theme.background, theme.error],
    ),
    transform: [{ translateX: shakeProgress.value }, { scale: scaleProgress.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.island,
        {
          left: x - radius,
          top: y - radius,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          borderWidth: 2,
        },
        animatedIslandStyle,
      ]}
    >
      <Text type="emphasized_body" color={isAtMax ? 'background' : 'text'}>
        {requiredBridges}
      </Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  island: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
