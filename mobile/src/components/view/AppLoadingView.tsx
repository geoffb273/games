import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, runOnJS } from 'react-native-reanimated';

import { useLatestRef } from '@/hooks/useLatestRef';
import { useStableCallback } from '@/hooks/useStableCallback';
import { useTheme } from '@/hooks/useTheme';
import { useTimeoutEffect } from '@/hooks/useTimeoutEffect';

import { LandingPageView } from './LandingPageView';

const MIN_LANDING__MS = 1000;

type LoadingStep = 'hidden' | 'landing' | 'can-hide' | 'hiding';

export function AppLoadingView({
  isLoading,
  onHidden,
}: {
  isLoading: boolean;
  onHidden: () => void;
}) {
  const onHiddenStable = useStableCallback(onHidden);
  const theme = useTheme();
  const [step, setStep] = useState<LoadingStep>(isLoading ? 'landing' : 'hidden');
  const stepRef = useLatestRef(step);

  useEffect(() => {
    if (step === 'hidden') {
      onHiddenStable();
    }
  }, [onHiddenStable, step]);

  useEffect(() => {
    if (isLoading) return;

    switch (step) {
      case 'hidden':
        return;
      case 'can-hide':
        setStep('hiding');
        return;
      case 'landing':
        const timeout = setTimeout(() => {
          setStep('can-hide');
        }, MIN_LANDING__MS);
        return () => clearTimeout(timeout);
    }
  }, [isLoading, step]);

  useTimeoutEffect(
    () => {
      if (!isLoading || stepRef.current !== 'landing') return;

      setStep('can-hide');
    },
    [isLoading, stepRef],
    MIN_LANDING__MS,
  );

  const showLogo = step === 'landing' || step === 'can-hide';

  return (
    <Animated.View style={[styles.overlay, { backgroundColor: theme.background }]}>
      {showLogo && (
        <Animated.View
          entering={FadeIn.duration(100)}
          exiting={FadeOut.duration(100).withCallback((finished) => {
            'worklet';
            if (finished) {
              runOnJS(setStep)('hidden');
            }
          })}
          style={styles.logo}
        >
          <LandingPageView />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  logo: {
    flex: 1,
  },
});
