import React, { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import mobileAds, {
  AdsConsent,
  type AdsConsentInfo,
  AdsConsentStatus,
} from 'react-native-google-mobile-ads';

import { AdConsentContext, type AdConsentContextType } from '@/context/AdConsentContext';
import { useStableCallback } from '@/hooks/useStableCallback';

type AdConsentProviderProps = { children: ReactNode };

let mobileAdsInitPromise: Promise<void> | null = null;

function ensureMobileAdsInitialized(): Promise<void> {
  if (!mobileAdsInitPromise) {
    mobileAdsInitPromise = mobileAds()
      .initialize()
      .then(() => undefined);
  }
  return mobileAdsInitPromise;
}

async function requestConsent(): Promise<AdsConsentInfo> {
  await ensureMobileAdsInitialized();
  return AdsConsent.requestInfoUpdate();
}

export function AdConsentProvider({ children }: AdConsentProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [consent, setConsent] = useState<AdsConsentInfo | null>(null);

  const checkConsent = useStableCallback(async () => {
    setIsLoading(true);
    try {
      const info = await requestConsent();
      setConsent(info);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setConsent(null);
    } finally {
      setIsLoading(false);
    }
  });

  const showConsentForm = useStableCallback(async () => {
    if (isLoading || consent == null) return false;

    if (
      consent.status === AdsConsentStatus.OBTAINED ||
      consent.status === AdsConsentStatus.NOT_REQUIRED
    ) {
      return true;
    }

    if (!consent.isConsentFormAvailable) {
      return false;
    }

    setIsLoading(true);
    try {
      const info = await AdsConsent.showForm();
      setConsent(info);
      setError(null);

      return info.canRequestAds;
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      return false;
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    void checkConsent();
  }, [checkConsent]);

  const refresh = useCallback(async () => {
    await checkConsent();
  }, [checkConsent]);

  const value: AdConsentContextType = useMemo(
    () => ({
      isLoading,
      error,
      isAllowedToRequestAds: consent?.canRequestAds ?? false,
      refresh,
      showConsentForm,
    }),
    [consent?.canRequestAds, error, isLoading, refresh, showConsentForm],
  );

  return <AdConsentContext.Provider value={value}>{children}</AdConsentContext.Provider>;
}
