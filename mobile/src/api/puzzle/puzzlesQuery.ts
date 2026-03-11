import { useMemo } from 'react';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { PuzzlesDocument } from '@/generated/gql/graphql';

import { mapToPuzzles } from './puzzle';

gql`
  query Puzzles($input: QueryPuzzlesInput!) {
    puzzles(input: $input) {
      __typename
      ... on Error {
        message
      }
      ... on QueryPuzzlesSuccess {
        data {
          id
          ...PuzzleFragment
        }
      }
    }
  }
`;

/**
 * Gets the puzzles for a specific daily challenge
 */
export function usePuzzlesQuery({
  dailyChallengeId,
  enabled = true,
}: {
  enabled?: boolean;
  dailyChallengeId: string | null | undefined;
}) {
  const { data, loading, error, refetch } = useQuery(PuzzlesDocument, {
    variables: { input: { dailyChallengeId } },
    skip: !enabled,
  });

  const puzzles = useMemo(
    () =>
      data?.puzzles.__typename === 'QueryPuzzlesSuccess'
        ? mapToPuzzles(data.puzzles.data).sort((a, b) => a.type.localeCompare(b.type))
        : null,
    [data],
  );

  return {
    puzzles,
    isLoading: loading,
    isError: error != null,
    error,
    refetch,
  };
}
