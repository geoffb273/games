import { gql } from '@apollo/client';

import { type FragmentType, useFragment } from '@/generated/gql';
import {
  HanjiPuzzleFragmentFragmentDoc,
  HashiPuzzleFragmentFragmentDoc,
  MinesweeperPuzzleFragmentFragmentDoc,
  PuzzleFragmentFragmentDoc,
} from '@/generated/gql/graphql';

const getFragmentData = useFragment;

gql`
  fragment HanjiPuzzleFragment on HanjiPuzzle {
    width
    height
    rowClues
    colClues
  }

  fragment HashiPuzzleFragment on HashiPuzzle {
    width
    height
    islands {
      row
      col
      requiredBridges
    }
  }

  fragment MinesweeperPuzzleFragment on MinesweeperPuzzle {
    width
    height
    mineCount
    revealedCells {
      col
      row
      value
    }
  }

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
      ...HanjiPuzzleFragment
    }
    ... on HashiPuzzle {
      __typename
      ...HashiPuzzleFragment
    }
    ... on MinesweeperPuzzle {
      __typename
      ...MinesweeperPuzzleFragment
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
  height: number;
  width: number;
  rowClues: number[][];
  colClues: number[][];
};

export type HashiPuzzle = PuzzleBase & {
  type: 'HASHI';
  height: number;
  width: number;
  islands: { row: number; col: number; requiredBridges: number }[];
};

export type MinesweeperPuzzle = PuzzleBase & {
  type: 'MINESWEEPER';
  height: number;
  width: number;
  mineCount: number;
  revealedCells: { col: number; row: number; value: number }[];
};

export type Puzzle = HanjiPuzzle | HashiPuzzle | MinesweeperPuzzle;

/**
 * Maps the graphql puzzle fragment type to the expected {@link Puzzle} type
 */
export function mapToPuzzle(data: FragmentType<typeof PuzzleFragmentFragmentDoc>): Puzzle {
  const puzzle = getFragmentData(PuzzleFragmentFragmentDoc, data);
  const { id, name, description, attempt: puzzleAttempt, __typename } = puzzle;

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
    case 'HanjiPuzzle': {
      const hanji = getFragmentData(HanjiPuzzleFragmentFragmentDoc, puzzle);
      return {
        ...shared,
        type: 'HANJI',
        height: hanji.height,
        width: hanji.width,
        rowClues: hanji.rowClues,
        colClues: hanji.colClues,
      };
    }
    case 'HashiPuzzle': {
      const hashi = getFragmentData(HashiPuzzleFragmentFragmentDoc, puzzle);
      return {
        ...shared,
        type: 'HASHI',
        height: hashi.height,
        width: hashi.width,
        islands: hashi.islands.map((i) => ({
          row: i.row,
          col: i.col,
          requiredBridges: i.requiredBridges,
        })),
      };
    }
    case 'MinesweeperPuzzle': {
      const minesweeper = getFragmentData(MinesweeperPuzzleFragmentFragmentDoc, puzzle);
      return {
        ...shared,
        type: 'MINESWEEPER',
        height: minesweeper.height,
        width: minesweeper.width,
        mineCount: minesweeper.mineCount,
        revealedCells: minesweeper.revealedCells.map((c) => ({
          col: c.col,
          row: c.row,
          value: c.value,
        })),
      };
    }
  }
}

/** @see {@link mapToPuzzle} */
export function mapToPuzzles(data: FragmentType<typeof PuzzleFragmentFragmentDoc>[]): Puzzle[] {
  return data.map(mapToPuzzle);
}
