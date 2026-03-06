import { useCallback } from 'react';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { PuzzleQueryDocument, type PuzzleQueryQuery } from '@/generated/gql/graphql';

import { mapToPuzzle, mapToPuzzleFragment, type Puzzle } from './puzzle';

gql`
  query PuzzleQuery($input: QueryPuzzleInput!) {
    puzzle(input: $input) {
      __typename
      ... on Error {
        __typename
        message
      }
      ... on QueryPuzzleSuccess {
        data {
          __typename
          ...PuzzleFragment
        }
      }
    }
  }
`;

type UsePuzzleQueryResult = {
  isLoading: boolean;
  isError: boolean;
  isNotFound: boolean;
  puzzle: Puzzle | null;
  refetch: () => void;
  /** Updates the puzzle attempt optimistically. Only use if puzzle has already been loaded */
  updateOptimisticallyPuzzleAttempt: (puzzleAttempt: {
    startedAt: Date;
    /** The date the puzzle was completed. Only set if the puzzle was completed successfully. */
    completedAt?: Date | undefined | null;
    /** The duration of the puzzle in milliseconds. Only set if the puzzle was completed successfully. */
    durationMs?: number | undefined | null;
  }) => void;
};

export function usePuzzleQuery({ id }: { id: string }): UsePuzzleQueryResult {
  const { data, loading, error, refetch, updateQuery } = useQuery(PuzzleQueryDocument, {
    variables: { input: { id } },
  });

  const puzzle =
    data?.puzzle?.__typename === 'QueryPuzzleSuccess' ? mapToPuzzle(data.puzzle.data) : null;

  const isNotFound = data?.puzzle?.__typename === 'NotFoundError';

  const optimisticallyUpdatePuzzle = useCallback(
    (updatedPuzzle: Puzzle) => {
      updateQuery((prev) => {
        if (prev?.puzzle?.__typename !== 'QueryPuzzleSuccess') return;

        return {
          ...prev,
          puzzle: {
            __typename: 'QueryPuzzleSuccess',
            data: mapToPuzzleFragment(updatedPuzzle),
          },
        } satisfies PuzzleQueryQuery;
      });
    },
    [updateQuery],
  );

  const updateOptimisticallyPuzzleAttempt = useCallback(
    ({
      completedAt,
      durationMs,
      startedAt,
    }: {
      startedAt: Date;
      completedAt?: Date | undefined | null;
      durationMs?: number | undefined | null;
    }) => {
      if (puzzle == null) return;

      optimisticallyUpdatePuzzle({
        ...puzzle,
        attempt: {
          startedAt,
          completedAt,
          durationMs,
        },
      });
    },
    [optimisticallyUpdatePuzzle, puzzle],
  );

  return {
    isLoading: loading,
    isError: error != null,
    isNotFound,
    puzzle,
    refetch,
    updateOptimisticallyPuzzleAttempt,
  };
}
