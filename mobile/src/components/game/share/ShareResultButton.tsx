import { type ReactElement, type Ref, useImperativeHandle } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  type ButtonAlign,
  type ButtonSize,
  type ButtonVariant,
} from '@/components/common/Button';
import { useCaptureAndShare } from '@/hooks/useCaptureAndShare';

type BaseShareResultButtonProps = {
  ref?: Ref<ShareResultButtonRef>;
  /** The fully-rendered share card to capture as an image. */
  children: ReactElement;
};

type ShareResultButtonProps = BaseShareResultButtonProps &
  (
    | {
        type: 'button';
        label?: string;
        variant?: ButtonVariant;
        size?: ButtonSize;
        align?: ButtonAlign;
        trigger?: never;
      }
    | {
        type: 'custom';
        trigger: ReactElement;
        label?: never;
        variant?: never;
        size?: never;
        align?: never;
      }
  );

export type ShareResultButtonRef = {
  share: () => void;
};

/**
 * Visible "Share Result" button that captures a hidden share card and opens
 * the native share sheet.
 *
 * The hidden card is rendered off-screen but laid out and on-window so
 * `react-native-view-shot` can capture it without flashing visible content.
 */
export function ShareResultButton({
  ref,
  children,
  label,
  type,
  trigger,
  ...buttonProps
}: ShareResultButtonProps) {
  const { captureRef, share, isSharing, isUnavailable } = useCaptureAndShare();

  useImperativeHandle(ref, () => ({
    share,
  }));

  if (isUnavailable) {
    return null;
  }

  return (
    <>
      {type === 'button' && (
        <Button onPress={share} disabled={isSharing} leadingIcon="upload" {...buttonProps}>
          {label}
        </Button>
      )}
      {type === 'custom' && (
        <Pressable
          onPress={() => {
            if (isSharing) return;
            share();
          }}
          disabled={isSharing}
        >
          {trigger}
        </Pressable>
      )}
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
