import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppLogo } from '@/components/common/AppLogo';
import { useLatestRef } from '@/hooks/useLatestRef';
import { useStableCallback } from '@/hooks/useStableCallback';
import { useTheme } from '@/hooks/useTheme';
import { useTimeoutEffect } from '@/hooks/useTimeoutEffect';

const INITIAL_BLANK_MS = 300;
const MIN_SPINNER_MS = 500;

type LoadingStep = 'hidden' | 'blank' | 'logo' | 'can-hide';

export function AppLoadingView({
  isLoading,
  onHidden,
}: {
  isLoading: boolean;
  onHidden: () => void;
}) {
  const onHiddenStable = useStableCallback(onHidden);
  const theme = useTheme();
  const [step, setStep] = useState<LoadingStep>(isLoading ? 'blank' : 'hidden');
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
      case 'blank':
        setStep('hidden');
        return;
      case 'logo':
        const timeout = setTimeout(() => {
          setStep('can-hide');
        }, MIN_SPINNER_MS);
        return () => clearTimeout(timeout);
    }
  }, [isLoading, step]);

  useTimeoutEffect(
    () => {
      if (!isLoading || stepRef.current !== 'blank') return;

      setStep('logo');
    },
    [isLoading, stepRef],
    INITIAL_BLANK_MS,
  );

  const showLogo = step === 'logo';

  return (
    <Animated.View style={[styles.overlay, { backgroundColor: theme.background }]}>
      {showLogo && (
        <Animated.View entering={FadeIn}>
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
