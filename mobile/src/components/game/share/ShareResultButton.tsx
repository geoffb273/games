import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, type ButtonVariant } from '@/components/common/Button';
import { useCaptureAndShare } from '@/hooks/useCaptureAndShare';

type ShareResultButtonProps = {
  /** The fully-rendered share card to capture as an image. */
  children: ReactElement;
  label: string;
  variant?: ButtonVariant;
};

/**
 * Visible "Share Result" button that captures a hidden share card and opens
 * the native share sheet.
 *
 * The hidden card is rendered off-screen but laid out and on-window so
 * `react-native-view-shot` can capture it without flashing visible content.
 */
export function ShareResultButton({ children, label, variant = 'ghost' }: ShareResultButtonProps) {
  const { captureRef, share, isSharing, isUnavailable } = useCaptureAndShare();

  if (isUnavailable) {
    return null;
  }

  return (
    <>
      <Button variant={variant} onPress={share} disabled={isSharing} leadingIcon="upload">
        {label}
      </Button>
      <View pointerEvents="none" collapsable={false} style={styles.offscreen}>
        <View ref={captureRef} collapsable={false}>
          {children}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -10000,
    top: -10000,
  },
});
