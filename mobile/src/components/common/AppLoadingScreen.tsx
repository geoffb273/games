import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';

const INITIAL_BLANK_MS = 300;
const MIN_SPINNER_MS = 500;
const EXIT_MS = 220;

type LoadingPhase = 'hidden' | 'blank' | 'spinner' | 'exiting';

type AppLoadingScreenProps = {
  isLoading: boolean;
};

export function AppLoadingScreen({ isLoading }: AppLoadingScreenProps) {
  const theme = useTheme();
  const [phase, setPhase] = useState<LoadingPhase>(isLoading ? 'blank' : 'hidden');
  const spinnerStartedAtRef = useRef<number | null>(null);
  const blankTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const overlayOpacity = useSharedValue(phase === 'hidden' ? 0 : 1);
  const spinnerOpacity = useSharedValue(phase === 'spinner' ? 1 : 0);

  useEffect(() => {
    if (blankTimerRef.current != null) {
      clearTimeout(blankTimerRef.current);
      blankTimerRef.current = null;
    }

    if (phase !== 'blank') return;

    blankTimerRef.current = setTimeout(() => {
      spinnerStartedAtRef.current = Date.now();
      setPhase('spinner');
    }, INITIAL_BLANK_MS);

    return () => {
      if (blankTimerRef.current != null) {
        clearTimeout(blankTimerRef.current);
        blankTimerRef.current = null;
      }
    };
  }, [phase]);

  useEffect(() => {
    if (hideTimerRef.current != null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (isLoading) {
      if (phase === 'hidden') setPhase('blank');
      if (phase === 'exiting') setPhase('spinner');
      return;
    }

    if (phase !== 'spinner') return;

    const spinnerElapsed = Date.now() - (spinnerStartedAtRef.current ?? Date.now());
    const msUntilCanHide = Math.max(MIN_SPINNER_MS - spinnerElapsed, 0);

    hideTimerRef.current = setTimeout(() => {
      setPhase('exiting');
    }, msUntilCanHide);

    return () => {
      if (hideTimerRef.current != null) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [isLoading, phase]);

  useEffect(() => {
    if (phase !== 'exiting') return;

    const exitTimer = setTimeout(() => {
      spinnerStartedAtRef.current = null;
      setPhase('hidden');
    }, EXIT_MS);

    return () => clearTimeout(exitTimer);
  }, [phase]);

  useEffect(() => {
    overlayOpacity.value = withTiming(phase === 'hidden' ? 0 : 1, {
      duration: phase === 'exiting' ? EXIT_MS : 120,
    });
  }, [overlayOpacity, phase]);

  useEffect(() => {
    spinnerOpacity.value = withTiming(phase === 'spinner' || phase === 'exiting' ? 1 : 0, {
      duration: 180,
    });
  }, [spinnerOpacity, phase]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: spinnerOpacity.value,
  }));

  if (phase === 'hidden') return null;

  return (
    <Animated.View
      pointerEvents={phase === 'exiting' ? 'none' : 'auto'}
      style={[styles.overlay, { backgroundColor: theme.background }, overlayStyle]}
    >
      <Animated.View style={spinnerStyle}>
        <ActivityIndicator size="large" color={theme.accentInk} accessibilityLabel="Loading" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
});
