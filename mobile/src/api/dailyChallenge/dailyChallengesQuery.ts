import { useMemo } from 'react';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { useFragment } from '@/generated/gql';
import {
  type DailyChallengeFragmentFragment,
  DailyChallengeFragmentFragmentDoc,
  DailyChallengesDocument,
} from '@/generated/gql/graphql';
import { useStableCallback } from '@/hooks/useStableCallback';

const getFragment = useFragment;

gql`
  fragment DailyChallengeFragment on DailyChallenge {
    id
    date
    completedPuzzleCount
    puzzleCount
  }

  query DailyChallenges($after: String, $first: Int) {
    dailyChallenges(after: $after, first: $first) {
      edges {
        node {
          ...DailyChallengeFragment
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const PAGE_SIZE = 10;

export type DailyChallenge = {
  id: string;
  date: Date;
  completedPuzzleCount: number;
  puzzleCount: number;
};

type DailyChallengeNode = DailyChallengeFragmentFragment;

type UseDailyChallengesQueryResult = {
  isLoading: boolean;
  isError: boolean;
  error: Error | null | undefined;
  dailyChallenges: DailyChallenge[];
  hasNextPage: boolean;
  fetchMore: () => void;
  isFetchingMore: boolean;
  refetch: () => void;
  optimisticallyUpdateDailyChallenge: (args: {
    id: string;
    update: (prev: DailyChallengeNode) => DailyChallengeNode;
  }) => void;
};

export function useDailyChallengesQuery({
  enabled = true,
  cacheOnly = false,
}: { enabled?: boolean; cacheOnly?: boolean } = {}): UseDailyChallengesQueryResult {
  const { data, loading, error, fetchMore, networkStatus, refetch, client } = useQuery(
    DailyChallengesDocument,
    {
      variables: { first: PAGE_SIZE },
      skip: !enabled,
      fetchPolicy: cacheOnly ? 'cache-only' : 'cache-and-network',
      // Default client policy is cache-and-network; without this, extra observers (e.g. game
      // screens) trigger a network round-trip whose first-page result replaces relay pagination.
      nextFetchPolicy: cacheOnly ? 'cache-only' : 'cache-first',
    },
  );

  const edges = data?.dailyChallenges?.edges;
  const pageInfo = data?.dailyChallenges?.pageInfo;

  const dailyChallenges: DailyChallenge[] = useMemo(() => {
    return (edges ?? []).flatMap((edge) => {
      const node = getFragment(DailyChallengeFragmentFragmentDoc, edge?.node);
      if (!node) return [];
      return [
        {
          id: node.id,
          date: node.date,
          completedPuzzleCount: node.completedPuzzleCount,
          puzzleCount: node.puzzleCount,
        },
      ];
    });
  }, [edges]);

  const isFetchingMore = networkStatus === 3;

  const handleFetchMore = useStableCallback(() => {
    if (!pageInfo?.hasNextPage || isFetchingMore) return;

    fetchMore({
      variables: {
        after: pageInfo.endCursor,
        first: PAGE_SIZE,
      },
    });
  });

  const optimisticallyUpdateDailyChallenge = useStableCallback(
    ({ id, update }: { id: string; update: (prev: DailyChallengeNode) => DailyChallengeNode }) => {
      // Each DailyChallenge is normalized in the cache by id, so writing the fragment directly
      // updates every active query (including all paginated pages of `dailyChallenges`) that
      // references this entity. This avoids the limitation of `updateQuery`, whose callback only
      // sees the current window of data for the specific variables passed to `useQuery`.
      const cacheId = client.cache.identify({ __typename: 'DailyChallenge', id });
      if (cacheId == null) return;

      const prev = client.cache.readFragment<DailyChallengeNode>({
        id: cacheId,
        fragment: DailyChallengeFragmentFragmentDoc,
        fragmentName: 'DailyChallengeFragment',
      });
      if (prev == null) return;

      const next = update(prev);
      client.cache.writeFragment<DailyChallengeNode>({
        id: cacheId,
        fragment: DailyChallengeFragmentFragmentDoc,
        data: { __typename: 'DailyChallenge', ...next },
      });
    },
  );

  return {
    isLoading: loading && !isFetchingMore,
    isError: error != null,
    error,
    dailyChallenges,
    hasNextPage: pageInfo?.hasNextPage ?? false,
    fetchMore: handleFetchMore,
    isFetchingMore,
    refetch,
    optimisticallyUpdateDailyChallenge,
  };
}
