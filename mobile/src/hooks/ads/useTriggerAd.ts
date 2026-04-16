import { useCallback, useEffect, useRef, useState } from 'react';
import { useRewardedAd } from 'react-native-google-mobile-ads';

import { randomUUID } from 'expo-crypto';

import { AD_MOB_AD_ID } from '@/constants/config';
import { useAdConsentContext } from '@/context/AdConsentContext';
import { useAuthFetchContext } from '@/context/AuthFetchContext';

type UseTriggerAdParams = {
  puzzleId: string;
  /** Called only when fullscreen presentation transitions (avoids spurious calls on mount). */
  onFullscreenPresentedChange?: (isPresented: boolean) => void;
};

type UseTriggerAdResult = {
  isDisabled: boolean;
  isEarnedReward?: boolean;
  /** True while the rewarded ad is fullscreen (`opened` and not yet `closed`). */
  isShowing: boolean;
  /** Shows the ad if the user has given consent, otherwise shows the consent form and tries to load the ad again. */
  onPressShowAd: () => Promise<void>;
  uniqueKey: string;
  generateNewUniqueKey: () => void;
};

/**
 * Hook to trigger a rewarded ad.
 */
export function useTriggerAd({
  puzzleId,
  onFullscreenPresentedChange,
}: UseTriggerAdParams): UseTriggerAdResult {
  const [uniqueKey, setUniqueKey] = useState(randomUUID());
  const { user } = useAuthFetchContext({ required: true });
  const {
    isAllowedToRequestAds,
    isLoading: isConsentLoading,
    error: consentError,
    showConsentForm,
  } = useAdConsentContext();
  const { load, isLoaded, isEarnedReward, show, isShowing } = useRewardedAd(AD_MOB_AD_ID, {
    requestNonPersonalizedAdsOnly: true,
    serverSideVerificationOptions: {
      userId: user.id,
      customData: encodeURIComponent(
        JSON.stringify({
          puzzleId,
          uniqueKey,
        }),
      ),
    },
  });

  const fullscreenPrevRef = useRef(false);
  useEffect(() => {
    if (isShowing === fullscreenPrevRef.current) return;
    fullscreenPrevRef.current = isShowing;
    onFullscreenPresentedChange?.(isShowing);
  }, [isShowing, onFullscreenPresentedChange]);

  useEffect(() => {
    if (!isAllowedToRequestAds || isConsentLoading || consentError) return;
    if (isLoaded) return;
    load();
  }, [isAllowedToRequestAds, consentError, isConsentLoading, isLoaded, load]);

  const onPressShowAd = useCallback(async () => {
    if (!isAllowedToRequestAds) {
      const isAllowed = await showConsentForm();
      if (isAllowed) {
        load();
      }
      return;
    }

    if (!isLoaded) return;

    show();
  }, [isLoaded, isAllowedToRequestAds, show, showConsentForm, load]);

  const generateNewUniqueKey = useCallback(() => {
    setUniqueKey(randomUUID());
  }, []);

  return {
    isDisabled: isConsentLoading || (isAllowedToRequestAds && !isLoaded),
    isEarnedReward,
    isShowing,
    onPressShowAd,
    uniqueKey,
    generateNewUniqueKey,
  };
}
