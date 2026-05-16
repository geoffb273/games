import { useCallback } from 'react';

import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

import { enqueueSolvePuzzle } from '@/client/mutationQueue/mutationQueue';
import { isOnline } from '@/client/networkState';
import { SolvePuzzleMutationDocument } from '@/generated/gql/graphql';

import { type PuzzleAttempt, type PuzzleType } from './puzzle';

gql`
  mutation SolvePuzzleMutation($input: MutationSolvePuzzleInput!) {
    solvePuzzle(input: $input) {
      __typename
      ... on Error {
        message
      }
      ... on MutationSolvePuzzleSuccess {
        data {
          id
          startedAt
          completedAt
          durationMs
        }
      }
    }
  }
`;

type HashiBridgeInput = {
  bridges: number;
  from: {
    row: number;
    col: number;
  };
  to: {
    row: number;
    col: number;
  };
};

type BaseSolvePuzzleInput = {
  puzzleId: string;
  startedAt: Date;
  completedAt?: Date | null;
  durationMs?: number | null;
};

type SlitherlinkSolutionInput = {
  horizontalEdges: boolean[][];
  verticalEdges: boolean[][];
};

export type SolvePuzzleInput =
  | (BaseSolvePuzzleInput & {
      puzzleType: PuzzleType.Hanji;
      hanjiSolution: number[][] | null;
      hashiSolution?: never;
      minesweeperSolution?: never;
      slitherlinkSolution?: never;
      flowSolution?: never;
    })
  | (BaseSolvePuzzleInput & {
      puzzleType: PuzzleType.Hashi;
      hashiSolution: HashiBridgeInput[] | null;
      hanjiSolution?: never;
      minesweeperSolution?: never;
      slitherlinkSolution?: never;
      flowSolution?: never;
    })
  | (BaseSolvePuzzleInput & {
      puzzleType: PuzzleType.Minesweeper;
      minesweeperSolution: boolean[][] | null;
      hanjiSolution?: never;
      hashiSolution?: never;
      slitherlinkSolution?: never;
      flowSolution?: never;
    })
  | (BaseSolvePuzzleInput & {
      puzzleType: PuzzleType.Slitherlink;
      slitherlinkSolution: SlitherlinkSolutionInput | null;
      hanjiSolution?: never;
      hashiSolution?: never;
      minesweeperSolution?: never;
      flowSolution?: never;
    })
  | (BaseSolvePuzzleInput & {
      puzzleType: PuzzleType.Flow;
      flowSolution: number[][] | null;
      hanjiSolution?: never;
      hashiSolution?: never;
      minesweeperSolution?: never;
      slitherlinkSolution?: never;
    });

export function useSolvePuzzle() {
  const [mutate, { loading, error }] = useMutation(SolvePuzzleMutationDocument);

  const solvePuzzle = useCallback(
    async (input: SolvePuzzleInput): Promise<PuzzleAttempt> => {
      if (!isOnline()) {
        enqueueSolvePuzzle(input);
        return {
          startedAt: input.startedAt,
          completedAt: input.completedAt,
          durationMs: input.durationMs,
        };
      }

      const { data } = await mutate({
        variables: {
          input,
        },
      });

      if (data?.solvePuzzle.__typename !== 'MutationSolvePuzzleSuccess') {
        throw new Error(data?.solvePuzzle.message ?? 'Unknown error');
      }

      return data.solvePuzzle.data;
    },
    [mutate],
  );

  return {
    solvePuzzle,
    isLoading: loading,
    isError: error != null,
  };
}
