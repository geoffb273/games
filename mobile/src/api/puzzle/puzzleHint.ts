import { gql } from '@apollo/client';

import { fragmentRegistry } from '@/client/apollo';
import { type FragmentType, useFragment } from '@/generated/gql/fragment-masking';
import {
  HanjiHintFragmentFragmentDoc,
  HashiHintFragmentFragmentDoc,
  MinesweeperHintFragmentFragmentDoc,
  PuzzleHintFragmentFragmentDoc,
  PuzzleType,
  SlitherlinkHintFragmentFragmentDoc,
} from '@/generated/gql/graphql';
import { aggressiveExhaustiveGuard } from '@/utils/guardUtils';

const getFragment = useFragment;

gql`
  fragment HanjiHintFragment on HanjiHint {
    row
    col
    value
  }

  fragment HashiHintFragment on HashiHint {
    from {
      row
      col
    }
    to {
      row
      col
    }
    bridges
  }

  fragment MinesweeperHintFragment on MinesweeperHint {
    row
    col
    isMine
  }

  fragment SlitherlinkHintFragment on SlitherlinkHint {
    row
    col
    edgeType
    filled
  }

  fragment PuzzleHintFragment on PuzzleHint {
    __typename
    ... on HanjiHint {
      ...HanjiHintFragment
    }
    ... on HashiHint {
      ...HashiHintFragment
    }
    ... on MinesweeperHint {
      ...MinesweeperHintFragment
    }
    ... on SlitherlinkHint {
      ...SlitherlinkHintFragment
    }
  }
`;

fragmentRegistry.register(PuzzleHintFragmentFragmentDoc);
fragmentRegistry.register(HanjiHintFragmentFragmentDoc);
fragmentRegistry.register(HashiHintFragmentFragmentDoc);
fragmentRegistry.register(MinesweeperHintFragmentFragmentDoc);
fragmentRegistry.register(SlitherlinkHintFragmentFragmentDoc);

export type PuzzleHint =
  | { puzzleType: PuzzleType.Hanji; row: number; col: number; value: number }
  | {
      puzzleType: PuzzleType.Hashi;
      from: { row: number; col: number };
      to: { row: number; col: number };
      bridges: number;
    }
  | { puzzleType: PuzzleType.Minesweeper; row: number; col: number; isMine: boolean }
  | {
      puzzleType: PuzzleType.Slitherlink;
      row: number;
      col: number;
      edgeType: 'HORIZONTAL' | 'VERTICAL';
      filled: boolean;
    };

export function mapToPuzzleHint(
  puzzleFragment: FragmentType<typeof PuzzleHintFragmentFragmentDoc>,
): PuzzleHint {
  const puzzle = getFragment(PuzzleHintFragmentFragmentDoc, puzzleFragment);

  switch (puzzle.__typename) {
    case 'HanjiHint': {
      return { ...getFragment(HanjiHintFragmentFragmentDoc, puzzle), puzzleType: PuzzleType.Hanji };
    }
    case 'HashiHint': {
      return { ...getFragment(HashiHintFragmentFragmentDoc, puzzle), puzzleType: PuzzleType.Hashi };
    }
    case 'MinesweeperHint': {
      return {
        ...getFragment(MinesweeperHintFragmentFragmentDoc, puzzle),
        puzzleType: PuzzleType.Minesweeper,
      };
    }
    case 'SlitherlinkHint': {
      return {
        ...getFragment(SlitherlinkHintFragmentFragmentDoc, puzzle),
        puzzleType: PuzzleType.Slitherlink,
      };
    }
    default: {
      return aggressiveExhaustiveGuard(puzzle);
    }
  }
}
