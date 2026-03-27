import { useCallback } from 'react';

import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

import { logError } from '@/client/newRelic';
import { EVENT } from '@/constants/event';
import { RequestPuzzleHintMutationDocument } from '@/generated/gql/graphql';

import { type PuzzleType } from './puzzle';
import { mapToPuzzleHint, type PuzzleHint } from './puzzleHint';

type HashiBridgeInput = {
  bridges: number;
  from: { row: number; col: number };
  to: { row: number; col: number };
};

type SlitherlinkSolutionInput = {
  horizontalEdges: boolean[][];
  verticalEdges: boolean[][];
};

type BaseRequestPuzzleHintInput = {
  puzzleId: string;
};

export type RequestPuzzleHintInput = BaseRequestPuzzleHintInput &
  (
    | {
        puzzleType: PuzzleType.Hanji;
        hanjiCurrentState?: number[][] | null;
        hashiCurrentState?: never;
        minesweeperCurrentState?: never;
        slitherlinkCurrentState?: never;
      }
    | {
        puzzleType: PuzzleType.Hashi;
        hashiCurrentState?: HashiBridgeInput[] | null;
        hanjiCurrentState?: never;
        minesweeperCurrentState?: never;
        slitherlinkCurrentState?: never;
      }
    | {
        puzzleType: PuzzleType.Hashi;
        hashiCurrentState?: HashiBridgeInput[] | null;
        hanjiCurrentState?: never;
        minesweeperCurrentState?: never;
        slitherlinkCurrentState?: never;
      }
    | {
        puzzleType: PuzzleType.Minesweeper;
        minesweeperCurrentState?: boolean[][] | null;
        hanjiCurrentState?: never;
        hashiCurrentState?: never;
        slitherlinkCurrentState?: never;
      }
    | {
        puzzleType: PuzzleType.Slitherlink;
        slitherlinkCurrentState?: SlitherlinkSolutionInput | null;
        hanjiCurrentState?: never;
        hashiCurrentState?: never;
        minesweeperCurrentState?: never;
      }
  );

gql`
  mutation RequestPuzzleHintMutation($input: MutationRequestPuzzleHintInput!) {
    requestPuzzleHint(input: $input) {
      __typename
      ... on Error {
        message
      }
      ... on MutationRequestPuzzleHintSuccess {
        data {
          __typename
          ...PuzzleHintFragment
        }
      }
    }
  }
`;

export type UseRequestPuzzleHintResult = {
  requestPuzzleHint: (input: RequestPuzzleHintInput) => Promise<PuzzleHint>;
  isLoading: boolean;
  isError: boolean;
};

export function useRequestPuzzleHint(): UseRequestPuzzleHintResult {
  const [mutate, { loading, error }] = useMutation(RequestPuzzleHintMutationDocument);

  const requestPuzzleHint = useCallback(
    async (input: RequestPuzzleHintInput): Promise<PuzzleHint> => {
      const { data } = await mutate({
        variables: {
          input,
        },
      });

      if (data?.requestPuzzleHint.__typename !== 'MutationRequestPuzzleHintSuccess') {
        logError(
          { event: EVENT.REQUEST_PUZZLE_HINT_ERROR },
          data?.requestPuzzleHint?.message ?? 'Unknown error',
        );
        throw new Error(data?.requestPuzzleHint?.message ?? 'Unknown error');
      }

      return mapToPuzzleHint(data.requestPuzzleHint.data);
    },
    [mutate],
  );

  return {
    requestPuzzleHint,
    isLoading: loading,
    isError: error != null,
  };
}
