import { useCallback, useEffect } from 'react';
import { useRewardedAd } from 'react-native-google-mobile-ads';

import { AD_MOB_AD_ID } from '@/constants/config';
import { useAdConsentContext } from '@/context/AdConsentContext';
import { useAuthFetchContext } from '@/context/AuthFetchContext';

type UseTriggerAdResult = {
  isDisabled: boolean;
  isEarnedReward?: boolean;
  /** Shows the ad if the user has given consent, otherwise shows the consent form and tries to load the ad again. */
  onPressShowAd: () => Promise<void>;
};

/**
 * Hook to trigger a rewarded ad.
 */
export function useTriggerAd({ puzzleId }: { puzzleId: string }): UseTriggerAdResult {
  const { user } = useAuthFetchContext({ required: true });
  const {
    isAllowedToRequestAds,
    isLoading: isConsentLoading,
    error: consentError,
    showConsentForm,
  } = useAdConsentContext();
  const { load, isLoaded, isEarnedReward, show } = useRewardedAd(AD_MOB_AD_ID, {
    requestNonPersonalizedAdsOnly: true,
    serverSideVerificationOptions: {
      userId: user.id,
      customData: JSON.stringify({
        puzzleId,
      }),
    },
  });

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

  return {
    isDisabled: isConsentLoading || (isAllowedToRequestAds && !isLoaded),
    isEarnedReward,
    onPressShowAd,
  };
}
