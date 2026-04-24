import { useCallback, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useUserStreakQuery } from '@/api/user/userStreakQuery';
import { Text } from '@/components/common/Text';
import { Radii, Spacing, ZIndex } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';

import {
  INITIAL_ANIMATION_DURATION,
  STREAK_ANIMATION_RETURN_DURATION,
  STREAK_ANIMATION_TO_CENTER_DURATION,
} from './constants';

export function UserStreak() {
  const theme = useTheme();
  const { streak, isLoading } = useUserStreakQuery();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const currentStreak = streak?.current ?? 0;
  const opacity = useSharedValue(0);

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const streakBadgeRef = useRef<View>(null);
  const centerOffsetRef = useRef({ x: 0, y: 0 });
  const baselineSetRef = useRef(false);
  const previousStreakRef = useRef(0);

  const measureBadgeCenterOffset = useCallback(() => {
    requestAnimationFrame(() => {
      streakBadgeRef.current?.measureInWindow((x, y, width, height) => {
        centerOffsetRef.current = {
          x: screenWidth / 2 - (x + width / 2),
          y: screenHeight / 2 - (y + height / 2),
        };
      });
    });
  }, [screenHeight, screenWidth]);

  useFocusEffect(
    useCallback(() => {
      if (isLoading || currentStreak === 0) {
        return;
      }

      if (!baselineSetRef.current) {
        baselineSetRef.current = true;
        previousStreakRef.current = currentStreak;
        opacity.value = withDelay(
          INITIAL_ANIMATION_DURATION,
          withTiming(1, { duration: INITIAL_ANIMATION_DURATION }),
        );
        return;
      }

      if (currentStreak !== previousStreakRef.current) {
        previousStreakRef.current = currentStreak;
        scale.value = withSequence(
          withTiming(2, {
            duration: STREAK_ANIMATION_TO_CENTER_DURATION,
            easing: Easing.out(Easing.cubic),
          }),
          withTiming(1, {
            duration: STREAK_ANIMATION_RETURN_DURATION,
            easing: Easing.inOut(Easing.quad),
          }),
        );
        translateX.value = withSequence(
          withTiming(centerOffsetRef.current.x, {
            duration: STREAK_ANIMATION_TO_CENTER_DURATION,
            easing: Easing.out(Easing.exp),
          }),
          withTiming(0, {
            duration: STREAK_ANIMATION_RETURN_DURATION,
            easing: Easing.inOut(Easing.sin),
          }),
        );
        translateY.value = withSequence(
          withTiming(centerOffsetRef.current.y, {
            duration: STREAK_ANIMATION_TO_CENTER_DURATION,
            easing: Easing.out(Easing.exp),
          }),
          withTiming(0, {
            duration: STREAK_ANIMATION_RETURN_DURATION,
            easing: Easing.inOut(Easing.sin),
          }),
        );
      }
    }, [currentStreak, isLoading, opacity, scale, translateX, translateY]),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (isLoading || currentStreak === 0) {
    return null;
  }

  return (
    <Animated.View
      ref={streakBadgeRef}
      onLayout={measureBadgeCenterOffset}
      style={[
        styles.streakBadgeContainer,
        { borderColor: theme.borderSubtle, backgroundColor: theme.background },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.streakBadge,
          {
            backgroundColor: theme.warningSurface,
          },
        ]}
      >
        <MaterialCommunityIcons name="fire" size={18} color={theme.warning} />
        <Text type="emphasized_body" _colorOverride={theme.warning}>
          {currentStreak}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  streakBadgeContainer: {
    zIndex: ZIndex.above,
    borderWidth: 1,
    height: '100%',
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
});
