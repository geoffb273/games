import { createContext, use } from 'react';

export type AdConsentContextType = {
  isLoading: boolean;
  error: Error | null;
  isAllowedToRequestAds: boolean;
  /** Clear UMP flow cache and run `gatherConsent` again (e.g. settings screen). */
  refresh: () => Promise<void>;
  /** Show the consent form. Returns whether the user is allowed to request ads after showing the form. */
  showConsentForm: () => Promise<boolean>;
};

export const AdConsentContext = createContext<AdConsentContextType | undefined>(undefined);

export function useAdConsentContext(): AdConsentContextType {
  const context = use(AdConsentContext);

  if (context == null) {
    throw new Error('useAdConsentContext must be used within an AdConsentProvider');
  }

  return context;
}
