import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/common/Text';
import { useStableCallback } from '@/hooks/useStableCallback';
import { useTheme } from '@/hooks/useTheme';

const ISLAND_RADIUS_RATIO = 0.4;
const COLOR_ANIMATION_DURATION = 200;
const COMPLETION_WAVE_DELAY_MS = 50;

export type HashiIslandProps = {
  requiredBridges: number;
  currentBridges: number;
  x: number;
  y: number;
  cellSize: number;
  /** Whether this island is the last in the wave. If so, it will notify call `onWaveComplete` when the animation is complete. */
  isLastInWave: boolean;
  /** Callback to call when the animation is complete. Only called if `isLastInWave` is true. */
  onWaveComplete?: () => void;
  /** Whether the completion wave is active. */
  isCompletionWaveActive: boolean;
};

export const HashiIsland = memo(function HashiIsland({
  requiredBridges,
  currentBridges,
  x,
  y,
  cellSize,
  isLastInWave,
  onWaveComplete,
  isCompletionWaveActive,
}: HashiIslandProps) {
  const theme = useTheme();
  const radius = cellSize * ISLAND_RADIUS_RATIO;
  const isAtMax = currentBridges >= requiredBridges;
  const isOverMax = currentBridges > requiredBridges;

  const backgroundProgress = useSharedValue(isAtMax ? 1 : 0);
  const borderColorProgress = useSharedValue(isOverMax ? 1 : 0);
  const shakeProgress = useSharedValue(0);
  const scaleProgress = useSharedValue(1);

  const stableOnWaveComplete = useStableCallback(() => onWaveComplete?.());

  const delayNumber = (x + y) / cellSize;

  useEffect(() => {
    if (!isCompletionWaveActive) return;

    const notifyComplete = isLastInWave
      ? (finished?: boolean) => {
          'worklet';
          if (finished) runOnJS(stableOnWaveComplete)();
        }
      : undefined;

    scaleProgress.value = withSequence(
      withTiming(1, { duration: delayNumber * COMPLETION_WAVE_DELAY_MS }),
      withTiming(1.2, { duration: 400 }),
      withTiming(0.9, { duration: 200 }),
      withTiming(1.4, { duration: 600 }),
      withTiming(1, { duration: 400 }, notifyComplete),
    );
  }, [scaleProgress, isLastInWave, stableOnWaveComplete, delayNumber, isCompletionWaveActive]);

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

  // useEffect(() => {
  //   if (!isOverMax) {
  //     shakeProgress.value = 0;
  //     scaleProgress.value = 1;
  //     return;
  //   }

  //   shakeProgress.value = withSequence(
  //     withTiming(-2, { duration: 40 }),
  //     withTiming(2, { duration: 40 }),
  //     withTiming(-1.5, { duration: 40 }),
  //     withTiming(1.5, { duration: 40 }),
  //     withTiming(0, { duration: 40 }),
  //   );

  //   scaleProgress.value = withTiming(1.1);
  // }, [isOverMax, scaleProgress, shakeProgress]);

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
