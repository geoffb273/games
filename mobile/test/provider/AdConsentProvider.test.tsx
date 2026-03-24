import React, { type ReactNode } from 'react';
import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  AdsConsentStatus,
} from 'react-native-google-mobile-ads';

import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useAdConsentContext } from '@/context/AdConsentContext';
import { AdConsentProvider } from '@/provider/AdConsentProvider';

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: jest.fn(),
  AdsConsent: {
    requestInfoUpdate: jest.fn(),
    showForm: jest.fn(),
  },
  AdsConsentStatus: {
    UNKNOWN: 'UNKNOWN',
    REQUIRED: 'REQUIRED',
    NOT_REQUIRED: 'NOT_REQUIRED',
    OBTAINED: 'OBTAINED',
  },
  AdsConsentPrivacyOptionsRequirementStatus: {
    UNKNOWN: 'UNKNOWN',
    REQUIRED: 'REQUIRED',
    NOT_REQUIRED: 'NOT_REQUIRED',
  },
}));

const mockInitialize = jest.fn(() => Promise.resolve());

function wrapper({ children }: { children: ReactNode }) {
  return <AdConsentProvider>{children}</AdConsentProvider>;
}

function baseConsentInfo(
  overrides?: Partial<{
    status: AdsConsentStatus;
    canRequestAds: boolean;
    isConsentFormAvailable: boolean;
    privacyOptionsRequirementStatus: AdsConsentPrivacyOptionsRequirementStatus;
  }>,
) {
  return {
    status: AdsConsentStatus.OBTAINED,
    canRequestAds: true,
    privacyOptionsRequirementStatus: AdsConsentPrivacyOptionsRequirementStatus.NOT_REQUIRED,
    isConsentFormAvailable: false,
    ...overrides,
  };
}

describe('useAdConsentContext', () => {
  it('throws when used outside AdConsentProvider', () => {
    expect(() => {
      renderHook(() => useAdConsentContext());
    }).toThrow('useAdConsentContext must be used within an AdConsentProvider');
  });
});

describe('AdConsentProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInitialize.mockResolvedValue(undefined);
    (mobileAds as jest.Mock).mockImplementation(() => ({
      initialize: mockInitialize,
    }));
  });

  it('initializes the SDK, requests consent info, and exposes canRequestAds', async () => {
    jest
      .mocked(AdsConsent.requestInfoUpdate)
      .mockResolvedValue(
        baseConsentInfo({ status: AdsConsentStatus.NOT_REQUIRED, canRequestAds: true }),
      );

    const { result } = renderHook(() => useAdConsentContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(AdsConsent.requestInfoUpdate).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.isAllowedToRequestAds).toBe(true);
  });

  it('when consent is required and a form is available, showConsentForm opens the form', async () => {
    jest.mocked(AdsConsent.requestInfoUpdate).mockResolvedValue(
      baseConsentInfo({
        status: AdsConsentStatus.REQUIRED,
        canRequestAds: false,
        isConsentFormAvailable: true,
        privacyOptionsRequirementStatus: AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
      }),
    );

    const { result } = renderHook(() => useAdConsentContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAllowedToRequestAds).toBe(false);

    jest
      .mocked(AdsConsent.showForm)
      .mockResolvedValue(
        baseConsentInfo({ status: AdsConsentStatus.OBTAINED, canRequestAds: true }),
      );

    await act(async () => {
      const allowed = await result.current.showConsentForm();
      expect(allowed).toBe(true);
    });

    expect(AdsConsent.showForm).toHaveBeenCalledTimes(1);
    expect(result.current.isAllowedToRequestAds).toBe(true);
  });

  it('refresh runs consent check again', async () => {
    jest.mocked(AdsConsent.requestInfoUpdate).mockResolvedValue(baseConsentInfo());

    const { result } = renderHook(() => useAdConsentContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(AdsConsent.requestInfoUpdate).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });

    expect(AdsConsent.requestInfoUpdate).toHaveBeenCalledTimes(2);
  });

  it('sets error and clears consent when requestInfoUpdate fails', async () => {
    jest.mocked(AdsConsent.requestInfoUpdate).mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useAdConsentContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error?.message).toBe('network');
    expect(result.current.isAllowedToRequestAds).toBe(false);
  });

  it('showConsentForm returns true without opening the form when consent is NOT_REQUIRED', async () => {
    jest
      .mocked(AdsConsent.requestInfoUpdate)
      .mockResolvedValue(baseConsentInfo({ status: AdsConsentStatus.NOT_REQUIRED }));

    const { result } = renderHook(() => useAdConsentContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      const allowed = await result.current.showConsentForm();
      expect(allowed).toBe(true);
    });

    expect(AdsConsent.showForm).not.toHaveBeenCalled();
  });

  it('showConsentForm returns false when REQUIRED but no form is available', async () => {
    jest.mocked(AdsConsent.requestInfoUpdate).mockResolvedValue(
      baseConsentInfo({
        status: AdsConsentStatus.REQUIRED,
        canRequestAds: false,
        isConsentFormAvailable: false,
        privacyOptionsRequirementStatus: AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
      }),
    );

    const { result } = renderHook(() => useAdConsentContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      const allowed = await result.current.showConsentForm();
      expect(allowed).toBe(false);
    });

    expect(AdsConsent.showForm).not.toHaveBeenCalled();
  });

  it('showConsentForm returns false while consent is still loading', async () => {
    jest.mocked(AdsConsent.requestInfoUpdate).mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useAdConsentContext(), { wrapper });

    await act(async () => {
      const allowed = await result.current.showConsentForm();
      expect(allowed).toBe(false);
    });

    expect(AdsConsent.showForm).not.toHaveBeenCalled();
  });
});
