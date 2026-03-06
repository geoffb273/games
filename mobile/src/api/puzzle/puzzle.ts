import { gql } from '@apollo/client';

import { type FragmentData } from '@/api/typeUtils';
import { fragmentRegistry } from '@/client/apollo';
import { type FragmentType, useFragment } from '@/generated/gql';
import {
  type HanjiPuzzleFragmentFragment,
  HanjiPuzzleFragmentFragmentDoc,
  type HashiPuzzleFragmentFragment,
  HashiPuzzleFragmentFragmentDoc,
  MinesweeperCellValue,
  type MinesweeperPuzzleFragmentFragment,
  MinesweeperPuzzleFragmentFragmentDoc,
  type PuzzleFragmentFragment,
  PuzzleFragmentFragmentDoc,
  type PuzzleQueryQuery,
  PuzzleType as PuzzleTypeGraphql,
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
    mineField
    revealedCells {
      col
      row
      value
    }
  }

  fragment PuzzleFragment on Puzzle {
    __typename
    id
    name
    description
    attempt {
      startedAt
      completedAt
      durationMs
    }
    ... on HanjiPuzzle {
      ...HanjiPuzzleFragment
    }
    ... on HashiPuzzle {
      ...HashiPuzzleFragment
    }
    ... on MinesweeperPuzzle {
      ...MinesweeperPuzzleFragment
    }
  }
`;

fragmentRegistry.register(PuzzleFragmentFragmentDoc);
fragmentRegistry.register(HanjiPuzzleFragmentFragmentDoc);
fragmentRegistry.register(HashiPuzzleFragmentFragmentDoc);
fragmentRegistry.register(MinesweeperPuzzleFragmentFragmentDoc);

export { PuzzleTypeGraphql as PuzzleType };

export type PuzzleAttempt = {
  startedAt: Date;
  completedAt?: Date | null;
  durationMs?: number | null;
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

/** 0-8 for adjacency count, or 'MINE' */
export type MinesweeperCellValueDisplay = number | 'MINE';

const MINESWEEPER_ENUM_TO_VALUE: Record<MinesweeperCellValue, MinesweeperCellValueDisplay> = {
  [MinesweeperCellValue.Zero]: 0,
  [MinesweeperCellValue.One]: 1,
  [MinesweeperCellValue.Two]: 2,
  [MinesweeperCellValue.Three]: 3,
  [MinesweeperCellValue.Four]: 4,
  [MinesweeperCellValue.Five]: 5,
  [MinesweeperCellValue.Six]: 6,
  [MinesweeperCellValue.Seven]: 7,
  [MinesweeperCellValue.Eight]: 8,
  [MinesweeperCellValue.Mine]: 'MINE',
};

const MINESWEEPER_VALUE_TO_ENUM: Record<MinesweeperCellValueDisplay, MinesweeperCellValue> = {
  0: MinesweeperCellValue.Zero,
  1: MinesweeperCellValue.One,
  2: MinesweeperCellValue.Two,
  3: MinesweeperCellValue.Three,
  4: MinesweeperCellValue.Four,
  5: MinesweeperCellValue.Five,
  6: MinesweeperCellValue.Six,
  7: MinesweeperCellValue.Seven,
  8: MinesweeperCellValue.Eight,
  MINE: MinesweeperCellValue.Mine,
};

export type MinesweeperPuzzle = PuzzleBase & {
  type: 'MINESWEEPER';
  height: number;
  width: number;
  mineCount: number;
  mineField: MinesweeperCellValueDisplay[][];
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
      const mineField = minesweeper.mineField.map((row) =>
        row.map((cell) => MINESWEEPER_ENUM_TO_VALUE[cell]),
      );
      return {
        ...shared,
        type: 'MINESWEEPER',
        height: minesweeper.height,
        width: minesweeper.width,
        mineCount: minesweeper.mineCount,
        mineField,
        revealedCells: minesweeper.revealedCells.map((c) => ({
          col: c.col,
          row: c.row,
          value: c.value,
        })),
      };
    }
  }
}

/** Type for the puzzle `data` field in QueryPuzzleSuccess (used for cache updates). */
type PuzzleQueryData = Extract<
  PuzzleQueryQuery['puzzle'],
  { __typename: 'QueryPuzzleSuccess' }
>['data'];

/** Unmasked base fields shared by all puzzle fragment variants. */
type PuzzleBaseFragmentData = FragmentData<PuzzleFragmentFragment>;

/** Unmasked fragment data for HanjiPuzzle. Keep in sync with PuzzleFragment + HanjiPuzzleFragment. */
export type HanjiPuzzleFragmentData = PuzzleBaseFragmentData &
  FragmentData<HanjiPuzzleFragmentFragment> & {
    __typename: 'HanjiPuzzle';
  };

/** Unmasked fragment data for HashiPuzzle. Keep in sync with PuzzleFragment + HashiPuzzleFragment. */
export type HashiPuzzleFragmentData = PuzzleBaseFragmentData &
  FragmentData<HashiPuzzleFragmentFragment> & {
    __typename: 'HashiPuzzle';
  };

/** Unmasked fragment data for MinesweeperPuzzle. Keep in sync with PuzzleFragment + MinesweeperPuzzleFragment. */
export type MinesweeperPuzzleFragmentData = PuzzleBaseFragmentData &
  FragmentData<MinesweeperPuzzleFragmentFragment> & {
    __typename: 'MinesweeperPuzzle';
  };

/** Union of all puzzle fragment data shapes (unmasked). */
export type PuzzleFragmentData =
  | HanjiPuzzleFragmentData
  | HashiPuzzleFragmentData
  | MinesweeperPuzzleFragmentData;

/**
 * Maps the {@link Puzzle} type to the shape expected when writing to the cache.
 */
export function mapToPuzzleFragment(puzzle: Puzzle): PuzzleQueryData {
  const attempt =
    puzzle.attempt != null
      ? {
          startedAt: puzzle.attempt.startedAt,
          completedAt: puzzle.attempt.completedAt ?? null,
          durationMs: puzzle.attempt.durationMs ?? null,
        }
      : null;

  const base: PuzzleBaseFragmentData = {
    id: puzzle.id,
    name: puzzle.name,
    description: puzzle.description,
    attempt,
  };

  switch (puzzle.type) {
    case 'HANJI': {
      const data: HanjiPuzzleFragmentData = {
        __typename: 'HanjiPuzzle',
        ...base,
        width: puzzle.width,
        height: puzzle.height,
        rowClues: puzzle.rowClues,
        colClues: puzzle.colClues,
      };
      return data as PuzzleQueryData;
    }
    case 'HASHI': {
      const data: HashiPuzzleFragmentData = {
        __typename: 'HashiPuzzle',
        ...base,
        width: puzzle.width,
        height: puzzle.height,
        islands: puzzle.islands.map((i) => ({
          row: i.row,
          col: i.col,
          requiredBridges: i.requiredBridges,
        })),
      };
      return data as PuzzleQueryData;
    }
    case 'MINESWEEPER': {
      const data: MinesweeperPuzzleFragmentData = {
        __typename: 'MinesweeperPuzzle',
        ...base,
        width: puzzle.width,
        height: puzzle.height,
        mineCount: puzzle.mineCount,
        mineField: puzzle.mineField.map((row) =>
          row.map((cell) => MINESWEEPER_VALUE_TO_ENUM[cell]),
        ),
        revealedCells: puzzle.revealedCells.map((c) => ({
          col: c.col,
          row: c.row,
          value: c.value,
        })),
      };
      return data as PuzzleQueryData;
    }
  }
}

/** @see {@link mapToPuzzle} */
export function mapToPuzzles(data: FragmentType<typeof PuzzleFragmentFragmentDoc>[]): Puzzle[] {
  return data.map(mapToPuzzle);
}
