import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, runOnJS } from 'react-native-reanimated';

import { AppLogo } from '@/components/common/AppLogo';
import { useLatestRef } from '@/hooks/useLatestRef';
import { useStableCallback } from '@/hooks/useStableCallback';
import { useTheme } from '@/hooks/useTheme';
import { useTimeoutEffect } from '@/hooks/useTimeoutEffect';

const MIN_LOGO__MS = 500;

type LoadingStep = 'hidden' | 'logo' | 'can-hide' | 'hiding';

export function AppLoadingView({
  isLoading,
  onHidden,
}: {
  isLoading: boolean;
  onHidden: () => void;
}) {
  const onHiddenStable = useStableCallback(onHidden);
  const theme = useTheme();
  const [step, setStep] = useState<LoadingStep>(isLoading ? 'logo' : 'hidden');
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
      case 'logo':
        const timeout = setTimeout(() => {
          setStep('can-hide');
        }, MIN_LOGO__MS);
        return () => clearTimeout(timeout);
    }
  }, [isLoading, step]);

  useTimeoutEffect(
    () => {
      if (!isLoading || stepRef.current !== 'logo') return;

      setStep('can-hide');
    },
    [isLoading, stepRef],
    MIN_LOGO__MS,
  );

  const showLogo = step === 'logo' || step === 'can-hide';

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
        >
          <AppLogo />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
