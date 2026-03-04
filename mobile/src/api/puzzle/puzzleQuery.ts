import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { useFragment } from '@/generated/gql';
import { PuzzleFragmentFragmentDoc, PuzzleQueryDocument } from '@/generated/gql/graphql';

import { mapToPuzzle, type Puzzle } from './puzzle';

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
};

export function usePuzzleQuery({ id }: { id: string }): UsePuzzleQueryResult {
  const { data, loading, error, refetch } = useQuery(PuzzleQueryDocument, {
    variables: { input: { id } },
  });

  const puzzle = mapToPuzzle(
    useFragment(
      PuzzleFragmentFragmentDoc,
      data?.puzzle.__typename === 'QueryPuzzleSuccess' ? data.puzzle.data : null,
    ),
  );

  const isNotFound = data?.puzzle?.__typename === 'NotFoundError';

  return { isLoading: loading, isError: error != null, isNotFound, puzzle, refetch };
}
