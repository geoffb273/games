import { useCallback, useRef, useState } from 'react';
import { type View } from 'react-native';

import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

type UseCaptureAndShareResult = {
  /** Attach to the View whose contents should be captured into an image. */
  captureRef: React.RefObject<View | null>;
  /** Capture the referenced view and open the native share sheet. */
  share: (params?: { dialogTitle?: string }) => Promise<void>;
  /** True while a capture/share flow is in progress. */
  isSharing: boolean;
  /**
   * True when the platform reports that sharing is unavailable (e.g. checked
   * after the first attempt). Use as a hint to disable the share UI.
   */
  isUnavailable: boolean;
};

/**
 * Captures the referenced view as a PNG and presents the native share sheet.
 *
 * The returned `captureRef` should be attached to a `View` rendering the
 * share-card content. The view must be laid out and on-screen at the moment
 * `share()` is invoked.
 */
export function useCaptureAndShare(): UseCaptureAndShareResult {
  const ref = useRef<View | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);

  const share = useCallback(async ({ dialogTitle }: { dialogTitle?: string } = {}) => {
    if (ref.current == null) return;
    setIsSharing(true);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        setIsUnavailable(true);
        return;
      }

      const uri = await captureRef(ref, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        UTI: 'public.png',
        dialogTitle,
      });
    } finally {
      setIsSharing(false);
    }
  }, []);

  return { captureRef: ref, share, isSharing, isUnavailable };
}
