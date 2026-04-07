import { memo, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/common/Text';
import {
  SUCCESS_COMPLETION_WAVE_DELAY_MS,
  SUCCESS_COMPLETION_WAVE_DURATIONS_MS,
} from '@/components/game/successCompletionTiming';
import { useStableCallback } from '@/hooks/useStableCallback';
import { useTheme } from '@/hooks/useTheme';

const ISLAND_RADIUS_RATIO = 0.4;
const COLOR_ANIMATION_DURATION = 200;
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
  onPress: () => void;
  isDisabled: boolean;
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
  onPress,
  isDisabled,
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
      withTiming(1, { duration: delayNumber * SUCCESS_COMPLETION_WAVE_DELAY_MS }),
      withTiming(1.2, { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.firstPulse }),
      withTiming(0.9, { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.settle }),
      withTiming(1.4, { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.bounce }),
      withTiming(1, { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.finalSettle }, notifyComplete),
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

  useEffect(() => {
    if (isCompletionWaveActive) return;

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
  }, [isCompletionWaveActive, isOverMax, scaleProgress, shakeProgress]);

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
      <Pressable
        onPress={onPress}
        disabled={isDisabled || isCompletionWaveActive}
        style={styles.islandPressable}
      >
        <Text type="emphasized_body" color={isAtMax ? 'background' : 'text'}>
          {requiredBridges}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  island: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  islandPressable: {
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
