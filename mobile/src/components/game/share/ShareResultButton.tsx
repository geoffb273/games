import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { FontAwesome } from '@expo/vector-icons';

import { Button } from '@/components/common/Button';
import { useCaptureAndShare } from '@/hooks/useCaptureAndShare';
import { useTheme } from '@/hooks/useTheme';

type ShareResultButtonProps = {
  /** The fully-rendered share card to capture as an image. */
  children: ReactElement;
};

/**
 * Visible "Share Result" button that captures a hidden share card and opens
 * the native share sheet.
 *
 * The hidden card is rendered off-screen but laid out and on-window so
 * `react-native-view-shot` can capture it without flashing visible content.
 */
export function ShareResultButton({ children }: ShareResultButtonProps) {
  const theme = useTheme();
  const { captureRef, share, isSharing, isUnavailable } = useCaptureAndShare();

  if (isUnavailable) {
    return null;
  }

  return (
    <>
      <Button
        variant="secondary"
        onPress={share}
        disabled={isSharing}
        leadingIcon={<FontAwesome name="share-square-o" size={20} color={theme.text} />}
      >
        {isSharing ? 'Preparing…' : 'Share Result'}
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
