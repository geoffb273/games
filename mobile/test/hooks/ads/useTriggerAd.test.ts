import { useRewardedAd } from 'react-native-google-mobile-ads';

import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { AdConsentContextType } from '@/context/AdConsentContext';
import { useAdConsentContext } from '@/context/AdConsentContext';
import { useAuthFetchContext } from '@/context/AuthFetchContext';
import { useTriggerAd } from '@/hooks/ads/useTriggerAd';

jest.mock('@/context/AdConsentContext');
jest.mock('@/context/AuthFetchContext', () => ({
  useAuthFetchContext: jest.fn(),
}));

jest.mock('react-native-google-mobile-ads', () => ({
  TestIds: { REWARDED: 'test-rewarded' },
  useRewardedAd: jest.fn(),
}));

function baseConsent(overrides?: Partial<AdConsentContextType>) {
  return {
    isLoading: false,
    error: null,
    isAllowedToRequestAds: true,
    refresh: jest.fn(),
    showConsentForm: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

/** Minimal `useRewardedAd` return shape for this hook (library type includes extra event flags). */
function mockRewardedAdReturn(
  load: jest.Mock,
  show: jest.Mock,
  overrides: { isLoaded: boolean; isEarnedReward?: boolean },
) {
  return {
    load,
    show,
    isEarnedReward: overrides.isEarnedReward,
    isLoaded: overrides.isLoaded,
    isShowing: false,
    isOpened: false,
    isClicked: false,
    isClosed: false,
  };
}

const TEST_PUZZLE_ID = 'test-puzzle-id';

describe('useTriggerAd', () => {
  const load = jest.fn();
  const show = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAuthFetchContext).mockReturnValue({
      status: 'authenticated',
      user: { id: 'test-user-id' },
    });
    jest.mocked(useAdConsentContext).mockReturnValue(baseConsent());
    jest
      .mocked(useRewardedAd)
      .mockReturnValue(mockRewardedAdReturn(load, show, { isLoaded: false }));
  });

  it('exposes isDisabled true while consent is loading', () => {
    jest.mocked(useAdConsentContext).mockReturnValue(baseConsent({ isLoading: true }));

    const { result } = renderHook(() => useTriggerAd({ puzzleId: TEST_PUZZLE_ID }));

    expect(result.current.isDisabled).toBe(true);
  });

  it('exposes isDisabled true when ads are allowed but the rewarded ad is not loaded yet', () => {
    const { result } = renderHook(() => useTriggerAd({ puzzleId: TEST_PUZZLE_ID }));

    expect(result.current.isDisabled).toBe(true);
  });

  it('exposes isDisabled false when ads are allowed and the rewarded ad is loaded', () => {
    jest
      .mocked(useRewardedAd)
      .mockReturnValue(mockRewardedAdReturn(load, show, { isLoaded: true, isEarnedReward: true }));

    const { result } = renderHook(() => useTriggerAd({ puzzleId: TEST_PUZZLE_ID }));

    expect(result.current.isDisabled).toBe(false);
  });

  it('exposes isDisabled false when the user is not allowed to request ads (button can open consent)', () => {
    jest.mocked(useAdConsentContext).mockReturnValue(baseConsent({ isAllowedToRequestAds: false }));

    const { result } = renderHook(() => useTriggerAd({ puzzleId: TEST_PUZZLE_ID }));

    expect(result.current.isDisabled).toBe(false);
  });

  it('forwards isEarnedReward from useRewardedAd', () => {
    jest
      .mocked(useRewardedAd)
      .mockReturnValue(mockRewardedAdReturn(load, show, { isLoaded: true, isEarnedReward: true }));

    const { result } = renderHook(() => useTriggerAd({ puzzleId: TEST_PUZZLE_ID }));

    expect(result.current.isEarnedReward).toBe(true);
  });

  it('calls load when consent allows requesting ads, consent is ready, and the ad is not loaded', async () => {
    renderHook(() => useTriggerAd({ puzzleId: TEST_PUZZLE_ID }));

    await waitFor(() => {
      expect(load).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call load when consent is still loading', () => {
    jest.mocked(useAdConsentContext).mockReturnValue(baseConsent({ isLoading: true }));

    renderHook(() => useTriggerAd({ puzzleId: TEST_PUZZLE_ID }));

    expect(load).not.toHaveBeenCalled();
  });

  it('does not call load when consent has an error', () => {
    jest
      .mocked(useAdConsentContext)
      .mockReturnValue(baseConsent({ error: new Error('consent failed') }));

    renderHook(() => useTriggerAd({ puzzleId: TEST_PUZZLE_ID }));

    expect(load).not.toHaveBeenCalled();
  });

  it('does not call load when the user is not allowed to request ads', () => {
    jest.mocked(useAdConsentContext).mockReturnValue(baseConsent({ isAllowedToRequestAds: false }));

    renderHook(() => useTriggerAd({ puzzleId: TEST_PUZZLE_ID }));

    expect(load).not.toHaveBeenCalled();
  });

  it('does not call load again when the ad is already loaded', async () => {
    jest
      .mocked(useRewardedAd)
      .mockReturnValue(mockRewardedAdReturn(load, show, { isLoaded: true }));

    renderHook(() => useTriggerAd({ puzzleId: TEST_PUZZLE_ID }));

    await waitFor(() => {
      expect(load).not.toHaveBeenCalled();
    });
  });

  it('when not allowed to request ads, onPressShowAd shows the consent form and loads if the user allows', async () => {
    const showConsentForm = jest.fn().mockResolvedValue(true);
    jest
      .mocked(useAdConsentContext)
      .mockReturnValue(baseConsent({ isAllowedToRequestAds: false, showConsentForm }));

    const { result } = renderHook(() => useTriggerAd({ puzzleId: TEST_PUZZLE_ID }));

    await act(async () => {
      await result.current.onPressShowAd();
    });

    expect(showConsentForm).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledTimes(1);
    expect(show).not.toHaveBeenCalled();
  });

  it('when not allowed to request ads, onPressShowAd does not load if consent stays disallowed', async () => {
    const showConsentForm = jest.fn().mockResolvedValue(false);
    jest
      .mocked(useAdConsentContext)
      .mockReturnValue(baseConsent({ isAllowedToRequestAds: false, showConsentForm }));

    const { result } = renderHook(() => useTriggerAd({ puzzleId: TEST_PUZZLE_ID }));

    await act(async () => {
      await result.current.onPressShowAd();
    });

    expect(showConsentForm).toHaveBeenCalledTimes(1);
    expect(load).not.toHaveBeenCalled();
  });

  it('when allowed but the ad is not loaded, onPressShowAd does not show', async () => {
    const { result } = renderHook(() => useTriggerAd({ puzzleId: TEST_PUZZLE_ID }));

    await act(async () => {
      await result.current.onPressShowAd();
    });

    expect(show).not.toHaveBeenCalled();
  });

  it('when allowed and the ad is loaded, onPressShowAd shows the ad', async () => {
    jest
      .mocked(useRewardedAd)
      .mockReturnValue(mockRewardedAdReturn(load, show, { isLoaded: true }));

    const { result } = renderHook(() => useTriggerAd({ puzzleId: TEST_PUZZLE_ID }));

    await act(async () => {
      await result.current.onPressShowAd();
    });

    expect(show).toHaveBeenCalledTimes(1);
  });
});
