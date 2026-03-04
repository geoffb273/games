import { gql } from '@apollo/client';

import { type PuzzleFragmentFragment } from '@/generated/gql/graphql';

gql`
  fragment PuzzleFragment on Puzzle {
    id
    name
    description
    attempt {
      id
      startedAt
      completedAt
      durationMs
    }
    ... on HanjiPuzzle {
      __typename
    }
    ... on HashiPuzzle {
      __typename
    }
    ... on MinesweeperPuzzle {
      __typename
    }
  }
`;

export type PuzzleAttempt = {
  id: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
};

export type PuzzleBase = {
  id: string;
  name: string;
  description: string | null;
  attempt: PuzzleAttempt | null;
};

export type HanjiPuzzle = PuzzleBase & {
  type: 'HANJI';
};

export type HashiPuzzle = PuzzleBase & {
  type: 'HASHI';
};

export type MinesweeperPuzzle = PuzzleBase & {
  type: 'MINESWEEPER';
};

export type Puzzle = HanjiPuzzle | HashiPuzzle | MinesweeperPuzzle;

export function mapToPuzzle(data: PuzzleFragmentFragment | null): Puzzle | null {
  if (data == null) return null;

  const { id, name, description, attempt: puzzleAttempt, __typename } = data;

  const attempt: PuzzleAttempt | null =
    puzzleAttempt != null
      ? {
          id: puzzleAttempt.id,
          startedAt: puzzleAttempt.startedAt,
          completedAt: puzzleAttempt.completedAt ?? null,
          durationMs: puzzleAttempt.durationMs ?? null,
        }
      : null;

  const shared: PuzzleBase = {
    id,
    name,
    description: description ?? null,
    attempt,
  };

  switch (__typename) {
    case 'HanjiPuzzle':
      return {
        ...shared,
        type: 'HANJI',
      };
    case 'HashiPuzzle':
      return {
        ...shared,
        type: 'HASHI',
      };
    case 'MinesweeperPuzzle':
      return {
        ...shared,
        type: 'MINESWEEPER',
      };
  }
}
