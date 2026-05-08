import { useEffect as MockedUseEffect } from 'react';

import { act, render, screen } from '@testing-library/react-native';

import { useDailyChallengesQuery } from '@/api/dailyChallenge/dailyChallengesQuery';
import { Text as MockText } from '@/components/common/Text';
import { AppLoadingView } from '@/components/view/AppLoadingView';
import { type AuthFetchContextType, useAuthFetchContext } from '@/context/AuthFetchContext';
import { InitialLoadGuard } from '@/provider/InitialLoadGuard';

jest.mock('@/api/dailyChallenge/dailyChallengesQuery');
jest.mock('@/api/puzzle/puzzlesQuery', () => ({
  usePuzzlesQuery: () => ({
    isLoading: false,
    error: null,
  }),
}));
jest.mock('@/context/AuthFetchContext');

jest.mock('@/components/common/ErrorView', () => ({
  ErrorView: ({ title, message }: { title?: string; message?: string | null }) => {
    return (
      <>
        {title != null ? <MockText>{title}</MockText> : null}
        {message != null ? <MockText>{message}</MockText> : null}
      </>
    );
  },
}));

jest.mock('@/components/view/AppLoadingView', () => ({
  AppLoadingView: jest.fn(
    ({ isLoading, onHidden }: { isLoading: boolean; onHidden: () => void }) => {
      MockedUseEffect(() => {
        if (!isLoading) {
          onHidden();
        }
      }, [isLoading, onHidden]);

      return <MockText>App loading</MockText>;
    },
  ),
}));

jest.useFakeTimers();

const authenticatedAuthStatus = {
  status: 'authenticated',
  user: { id: 'user-1' },
} satisfies AuthFetchContextType;

const loadingDailyChallenges = {
  isLoading: true,
  dailyChallenges: [],
  error: null,
};

const loadedDailyChallenges = {
  isLoading: false,
  dailyChallenges: [{ id: 'daily-challenge-1' }],
  error: null,
};

function mockAuthStatus(status: AuthFetchContextType) {
  jest.mocked(useAuthFetchContext as unknown as () => AuthFetchContextType).mockReturnValue(status);
}

function mockDailyChallengesQuery(result: {
  isLoading: boolean;
  dailyChallenges: { id: string }[];
  error: Error | null;
}) {
  jest
    .mocked(useDailyChallengesQuery)
    .mockReturnValue(result as ReturnType<typeof useDailyChallengesQuery>);
}

function renderGuard() {
  return render(
    <InitialLoadGuard>
      <MockText>Home content</MockText>
    </InitialLoadGuard>,
  );
}

describe('InitialLoadGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows an error view when auth is still loading after the max initial wait', () => {
    mockAuthStatus({ status: 'loading' });
    mockDailyChallengesQuery({ ...loadedDailyChallenges, dailyChallenges: [] });

    renderGuard();

    expect(screen.getByText('App loading')).toBeOnTheScreen();

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(screen.getByText('Error')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'The app is taking longer than expected to sign in. Please check your connection and try again.',
      ),
    ).toBeOnTheScreen();
  });

  it('renders children when non-auth initial loading exceeds the max initial wait', () => {
    mockAuthStatus(authenticatedAuthStatus);
    mockDailyChallengesQuery(loadingDailyChallenges);

    renderGuard();

    expect(screen.getByText('App loading')).toBeOnTheScreen();

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(screen.getByText('Home content')).toBeOnTheScreen();
    expect(screen.queryByText('App loading')).toBeNull();
  });

  it('shows app loading view when auth is loading and daily challenges are loading before the max initial wait', () => {
    mockAuthStatus({ status: 'loading' });
    mockDailyChallengesQuery(loadingDailyChallenges);
    renderGuard();

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(screen.getByText('App loading')).toBeOnTheScreen();
    expect(screen.queryByText('Home content')).toBeNull();
  });

  it('preserves the normal fast load path before rendering children', () => {
    mockAuthStatus(authenticatedAuthStatus);
    mockDailyChallengesQuery(loadedDailyChallenges);
    renderGuard();

    expect(screen.getByText('App loading')).toBeOnTheScreen();
    expect(screen.queryByText('Home content')).toBeNull();
    expect(AppLoadingView).toHaveBeenLastCalledWith(
      expect.objectContaining({ isLoading: false }),
      undefined,
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText('Home content')).toBeOnTheScreen();
  });
});
