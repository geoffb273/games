import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';

const BRIDGE_THICKNESS = 4;
const BRIDGE_OFFSET = 5;
const TOUCH_SLOP = 14;

type HashiBridgeProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  count: 0 | 1 | 2;
  disabled?: boolean;
  onPress: () => void;
};

export const HashiBridge = memo(function HashiBridge({
  x1,
  y1,
  x2,
  y2,
  count,
  disabled = false,
  onPress,
}: HashiBridgeProps) {
  const theme = useTheme();
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const lineCenterY = TOUCH_SLOP - BRIDGE_THICKNESS / 2;

  return (
    <Pressable
      testID="hashi-bridge"
      disabled={disabled}
      onPress={onPress}
      pointerEvents={disabled ? 'none' : 'auto'}
      style={[
        styles.bridgeTouchArea,
        {
          left: x1,
          top: y1 - TOUCH_SLOP,
          width: Math.max(length, 24),
          height: TOUCH_SLOP * 2,
          transformOrigin: 'left center',
          transform: [{ rotate: `${angleDeg}deg` }],
        },
      ]}
    >
      {count >= 1 && (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          layout={LinearTransition.duration(180)}
          style={[
            styles.bridgeLine,
            {
              position: 'absolute',
              left: 0,
              top: lineCenterY - (count === 2 ? BRIDGE_OFFSET : 0),
              width: length,
              height: BRIDGE_THICKNESS,
              backgroundColor: theme.text,
            },
          ]}
        />
      )}
      {count >= 2 && (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={[
            styles.bridgeLine,
            {
              position: 'absolute',
              left: 0,
              top: lineCenterY + BRIDGE_OFFSET,
              width: length,
              height: BRIDGE_THICKNESS,
              backgroundColor: theme.text,
            },
          ]}
        />
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  bridgeTouchArea: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  bridgeLine: {
    position: 'absolute',
    left: 0,
    borderRadius: 2,
  },
});
