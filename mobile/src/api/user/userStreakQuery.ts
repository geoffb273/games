import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { useFragment } from '@/generated/gql';
import {
  UserStreakDocument,
  type UserStreakFragmentFragment,
  UserStreakFragmentFragmentDoc,
} from '@/generated/gql/graphql';
import { useStableCallback } from '@/hooks/useStableCallback';

import { type DailyChallengeStreak, mapToUserStreak } from './user';

const getFragmentData = useFragment;

gql`
  query UserStreak {
    currentUser {
      __typename
      ... on Error {
        __typename
        message
      }
      ... on QueryCurrentUserSuccess {
        data {
          ...UserStreakFragment
        }
      }
    }
  }
`;

type UseUserStreakQueryResult = {
  isLoading: boolean;
  isError: boolean;
  streak: DailyChallengeStreak | null;
  refetch: () => void;
  /**
   * Optimistically updates the current user's daily challenge streak in the cache.
   * no-op if the user has not yet been loaded into the cache.
   */
  optimisticallyUpdateUserStreak: (
    update: (prev: DailyChallengeStreak) => DailyChallengeStreak,
  ) => void;
};

/**
 * Fetches the current user's daily challenge streak (current and max).
 *
 * Assumes the user is logged in (has a valid auth token); returns an error otherwise.
 */
export function useUserStreakQuery({
  enabled = true,
  cacheOnly = false,
}: {
  /** Whether to trigger the query */
  enabled?: boolean;
  /** If true, only read from the cache and never hit the network. */
  cacheOnly?: boolean;
} = {}): UseUserStreakQueryResult {
  const { data, loading, error, refetch, client } = useQuery(UserStreakDocument, {
    skip: !enabled,
    fetchPolicy: cacheOnly ? 'cache-only' : 'cache-and-network',
    // Default client policy is cache-and-network; without this, extra observers trigger
    // a redundant network round-trip after the initial fetch.
    nextFetchPolicy: cacheOnly ? 'cache-only' : 'cache-first',
  });

  const currentUserData =
    data?.currentUser?.__typename === 'QueryCurrentUserSuccess' ? data.currentUser.data : null;

  const streak = currentUserData != null ? mapToUserStreak(currentUserData) : null;

  const optimisticallyUpdateUserStreak = useStableCallback(
    (update: (prev: DailyChallengeStreak) => DailyChallengeStreak) => {
      const fragment =
        currentUserData != null
          ? getFragmentData(UserStreakFragmentFragmentDoc, currentUserData)
          : null;
      if (fragment == null) return;

      const cacheId = client.cache.identify({ __typename: 'AuthenticatedUser', id: fragment.id });
      if (cacheId == null) return;

      const prev = client.cache.readFragment<UserStreakFragmentFragment>({
        id: cacheId,
        fragment: UserStreakFragmentFragmentDoc,
        fragmentName: 'UserStreakFragment',
      });
      if (prev == null) return;

      const next = update({
        current: prev.dailyChallengeStreak.current,
        max: prev.dailyChallengeStreak.max,
      });

      client.cache.writeFragment<UserStreakFragmentFragment>({
        id: cacheId,
        fragment: UserStreakFragmentFragmentDoc,
        fragmentName: 'UserStreakFragment',
        data: {
          __typename: 'AuthenticatedUser',
          id: fragment.id,
          dailyChallengeStreak: {
            __typename: 'DailyChallengeStreak',
            current: next.current,
            max: next.max,
          },
        },
      });
    },
  );

  return {
    isLoading: loading,
    isError: error != null,
    streak,
    refetch,
    optimisticallyUpdateUserStreak,
  };
}
