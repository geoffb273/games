import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { DailyChallengesDocument } from '@/generated/gql/graphql';

gql`
  query DailyChallenges($after: String, $first: Int) {
    dailyChallenges(after: $after, first: $first) {
      edges {
        node {
          id
          date
          completedPuzzleCount
          puzzleCount
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

type DailyChallenge = {
  id: string;
  date: Date;
  completedPuzzleCount: number;
  puzzleCount: number;
};

type UseDailyChallengesQueryResult = {
  isLoading: boolean;
  isError: boolean;
  dailyChallenges: DailyChallenge[];
  hasNextPage: boolean;
  fetchMore: () => void;
  isFetchingMore: boolean;
  refetch: () => void;
};

export function useDailyChallengesQuery(): UseDailyChallengesQueryResult {
  const { data, loading, error, fetchMore, networkStatus, refetch } = useQuery(
    DailyChallengesDocument,
    {
      variables: { first: PAGE_SIZE },
    },
  );

  const edges = data?.dailyChallenges?.edges;
  const pageInfo = data?.dailyChallenges?.pageInfo;

  const dailyChallenges: DailyChallenge[] = (edges ?? []).flatMap((edge) => {
    const node = edge?.node;
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

  const isFetchingMore = networkStatus === 3;

  const handleFetchMore = () => {
    if (!pageInfo?.hasNextPage || isFetchingMore) return;

    fetchMore({
      variables: {
        after: pageInfo.endCursor,
        first: PAGE_SIZE,
      },
    });
  };

  return {
    isLoading: loading && !isFetchingMore,
    isError: error != null,
    dailyChallenges,
    hasNextPage: pageInfo?.hasNextPage ?? false,
    fetchMore: handleFetchMore,
    isFetchingMore,
    refetch,
  };
}
