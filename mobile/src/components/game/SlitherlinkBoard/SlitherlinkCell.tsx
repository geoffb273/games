import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
import { Spacing } from '@/constants/token';
import { useStableCallback } from '@/hooks/useStableCallback';
import { useTheme } from '@/hooks/useTheme';
import { getColorWithOpacity } from '@/utils/colorUtils';

type EdgeState = 'empty' | 'line';

type SlitherlinkCellProps = {
  size: number;
  clue: number | null;
  top: EdgeState;
  left: EdgeState;
  bottom: EdgeState;
  right: EdgeState;
  onPressTop: () => void;
  onPressLeft: () => void;
  onPressBottom: () => void;
  onPressRight: () => void;
  showBottomEdge: boolean;
  showRightEdge: boolean;
  isDisabled?: boolean;
  isCompletionWaveActive?: boolean;
  waveDelayNumber?: number;
  isLastInWave?: boolean;
  onWaveComplete?: () => void;
};

const LINE_THICKNESS = 4;
const DOT_SIZE = 8;
/**
 * Renders a cells clues and edges.
 *
 * Bottom and right edges should only be rendered if the cell is the last cell in the row or column.
 */
export function SlitherlinkCell({
  size,
  clue,
  top,
  left,
  bottom,
  right,
  onPressTop,
  onPressLeft,
  onPressBottom,
  onPressRight,
  showBottomEdge,
  showRightEdge,
  isDisabled = false,
  isCompletionWaveActive = false,
  waveDelayNumber = 0,
  isLastInWave = false,
  onWaveComplete,
}: SlitherlinkCellProps) {
  const lines = [top, left, bottom, right].filter((line) => line === 'line').length;

  const isTooManyLines = clue != null && lines > clue;

  const errorProgress = useSharedValue(0);
  const shake = useSharedValue(0);
  const scale = useSharedValue(1);
  const stableOnWaveComplete = useStableCallback(() => onWaveComplete?.());

  // Animate the error progress and shake the clue if the cell has too many lines
  useEffect(() => {
    errorProgress.value = withTiming(isTooManyLines ? 1 : 0, { duration: 150 });
    if (isTooManyLines) {
      shake.value = withSequence(
        withTiming(-1, { duration: 50 }),
        withTiming(2, { duration: 100 }),
        withTiming(-1, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    } else {
      shake.value = 0;
    }
  }, [errorProgress, isTooManyLines, shake]);

  const clueErrorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 + 0.2 * errorProgress.value }, { translateX: shake.value }],
    };
  });

  // Completion scale animation: each cell scales in sequence. Last cell notifies parent when done.
  useEffect(() => {
    if (!isCompletionWaveActive) return;

    const notifyComplete = isLastInWave
      ? (finished?: boolean) => {
          'worklet';
          if (finished) runOnJS(stableOnWaveComplete)();
        }
      : undefined;

    scale.value = withSequence(
      withTiming(1, { duration: waveDelayNumber * SUCCESS_COMPLETION_WAVE_DELAY_MS }),
      withTiming(1.1, { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.firstPulse }),
      withTiming(0.95, { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.settle }),
      withTiming(1.15, { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.bounce }),
      withTiming(1, { duration: SUCCESS_COMPLETION_WAVE_DURATIONS_MS.finalSettle }, notifyComplete),
    );
  }, [isCompletionWaveActive, isLastInWave, scale, stableOnWaveComplete, waveDelayNumber]);

  const completionWaveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[styles.container, { width: size, height: size }, completionWaveAnimatedStyle]}
    >
      <Dot position="topLeft" />
      {showBottomEdge && <Dot position="bottomLeft" />}
      {showRightEdge && <Dot position="topRight" />}
      {showBottomEdge && showRightEdge && <Dot position="bottomRight" />}
      {/* Top edge row */}
      <HorizontalEdgeStrip
        state={top}
        onPress={onPressTop}
        testID="slitherlink-cell-edge-top"
        isDisabled={isDisabled}
      />

      {/* Middle row: left/right edges + clue */}
      <View style={styles.middleRow}>
        <VerticalEdgeStrip
          state={left}
          onPress={onPressLeft}
          testID="slitherlink-cell-edge-left"
          isDisabled={isDisabled}
        />

        <Animated.View style={[styles.clueContainer, clueErrorStyle]}>
          {clue != null && (
            <Text
              size="lg"
              fontWeight={isTooManyLines ? 'semibold' : 'regular'}
              textAlign="center"
              color={isTooManyLines ? 'error' : 'text'}
            >
              {clue}
            </Text>
          )}
        </Animated.View>

        {showRightEdge && (
          <VerticalEdgeStrip
            state={right}
            onPress={onPressRight}
            testID="slitherlink-cell-edge-right"
            isDisabled={isDisabled}
          />
        )}
      </View>

      {/* Bottom edge row */}
      {showBottomEdge && (
        <HorizontalEdgeStrip
          state={bottom}
          onPress={onPressBottom}
          testID="slitherlink-cell-edge-bottom"
          isDisabled={isDisabled}
        />
      )}
    </Animated.View>
  );
}

function HorizontalEdgeStrip({
  state,
  onPress,
  testID,
  isDisabled,
}: {
  state: EdgeState;
  onPress: () => void;
  testID?: string;
  isDisabled?: boolean;
}) {
  const theme = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(state === 'line' ? 1 : 0, { duration: 300 });
  }, [progress, state]);

  const transparentColor = getColorWithOpacity(theme.text, 0);

  const backgroundColor = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(progress.value, [0, 1], [transparentColor, theme.text]),
    };
  });

  return (
    <Pressable
      style={styles.edgeStripHorizontal}
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={{ top: DOT_SIZE * 2, bottom: DOT_SIZE * 2 }}
      testID={testID}
    >
      <Animated.View style={[styles.line, backgroundColor]} />
    </Pressable>
  );
}

function VerticalEdgeStrip({
  state,
  onPress,
  testID,
  isDisabled,
}: {
  state: EdgeState;
  onPress: () => void;
  testID?: string;
  isDisabled?: boolean;
}) {
  const theme = useTheme();

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(state === 'line' ? 1 : 0, { duration: 300 });
  }, [progress, state]);

  const transparentColor = getColorWithOpacity(theme.text, 0);

  const backgroundColor = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(progress.value, [0, 1], [transparentColor, theme.text]),
    };
  });

  return (
    <Pressable
      style={styles.edgeStripVertical}
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={{ left: DOT_SIZE * 2, right: DOT_SIZE * 2 }}
      testID={testID}
    >
      <Animated.View style={[styles.line, backgroundColor]} />
    </Pressable>
  );
}

function Dot({ position }: { position: 'topLeft' | 'bottomLeft' | 'bottomRight' | 'topRight' }) {
  const theme = useTheme();

  return <View style={[styles.dot, dotPositions[position], { backgroundColor: theme.text }]} />;
}

const dotPositions: Record<
  'topLeft' | 'bottomLeft' | 'bottomRight' | 'topRight',
  { top?: number; left?: number; right?: number; bottom?: number }
> = {
  topLeft: {
    top: -DOT_SIZE / 4,
    left: -DOT_SIZE / 4,
  },
  bottomLeft: {
    bottom: -DOT_SIZE / 4,
    left: -DOT_SIZE / 4,
  },
  bottomRight: {
    bottom: -DOT_SIZE / 4,
    right: -DOT_SIZE / 4,
  },
  topRight: {
    top: -DOT_SIZE / 4,
    right: -DOT_SIZE / 4,
  },
};

const styles = StyleSheet.create({
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    position: 'absolute',
  },
  container: {
    flexDirection: 'column',
  },
  middleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  edgeStripHorizontal: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: LINE_THICKNESS,
  },
  edgeStripVertical: {
    width: LINE_THICKNESS,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
  },
  clueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
    pointerEvents: 'none',
  },
  line: {
    borderRadius: Spacing.one,
    width: '100%',
    height: '100%',
  },
});
