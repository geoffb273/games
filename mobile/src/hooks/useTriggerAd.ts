import { useCallback, useEffect } from 'react';
import { useRewardedAd } from 'react-native-google-mobile-ads';

import { AD_MOB_AD_ID } from '@/constants/config';

type UseTriggerAdResult = {
  isLoaded: boolean;
  isEarnedReward?: boolean;
  onPressShowAd: () => void;
};

/**
 * Hook to trigger a rewarded ad.
 */
export function useTriggerAd(): UseTriggerAdResult {
  const { load, isLoaded, isEarnedReward, show } = useRewardedAd(AD_MOB_AD_ID);

  useEffect(() => {
    if (isLoaded) return;
    load();
  }, [isLoaded, load]);

  const onPressShowAd = useCallback(() => {
    if (!isLoaded) return;
    show();
  }, [isLoaded, show]);

  return {
    isLoaded,
    isEarnedReward,
    onPressShowAd,
  };
}
