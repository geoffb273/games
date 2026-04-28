import { gql } from '@apollo/client';

import { type FragmentData } from '@/api/typeUtils';
import { fragmentRegistry } from '@/client/apollo';
import { type FragmentType, useFragment } from '@/generated/gql';
import {
  type FlowPuzzleFragmentFragment,
  FlowPuzzleFragmentFragmentDoc,
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
  PuzzleType,
  PuzzleType as PuzzleTypeGraphql,
  type SlitherlinkPuzzleFragmentFragment,
  SlitherlinkPuzzleFragmentFragmentDoc,
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

  fragment SlitherlinkPuzzleFragment on SlitherlinkPuzzle {
    width
    height
    clues
  }

  fragment FlowPuzzleFragment on FlowPuzzle {
    width
    height
    pairs {
      number
      ends {
        row
        col
      }
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
    dailyChallenge {
      __typename
      ... on PuzzleDailyChallengeSuccess {
        data {
          id
          date
        }
      }
      ... on Error {
        message
      }
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
    ... on SlitherlinkPuzzle {
      ...SlitherlinkPuzzleFragment
    }
    ... on FlowPuzzle {
      ...FlowPuzzleFragment
    }
  }
`;

fragmentRegistry.register(PuzzleFragmentFragmentDoc);
fragmentRegistry.register(HanjiPuzzleFragmentFragmentDoc);
fragmentRegistry.register(HashiPuzzleFragmentFragmentDoc);
fragmentRegistry.register(MinesweeperPuzzleFragmentFragmentDoc);
fragmentRegistry.register(SlitherlinkPuzzleFragmentFragmentDoc);
fragmentRegistry.register(FlowPuzzleFragmentFragmentDoc);

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
  dailyChallenge: {
    id: string;
    date: Date;
  };
};

export type HanjiPuzzle = PuzzleBase & {
  type: PuzzleType.Hanji;
  height: number;
  width: number;
  rowClues: number[][];
  colClues: number[][];
};

export type HashiPuzzle = PuzzleBase & {
  type: PuzzleType.Hashi;
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
  type: PuzzleType.Minesweeper;
  height: number;
  width: number;
  mineCount: number;
  mineField: MinesweeperCellValueDisplay[][];
  revealedCells: { col: number; row: number; value: number }[];
};

export type SlitherlinkPuzzle = PuzzleBase & {
  type: PuzzleType.Slitherlink;
  height: number;
  width: number;
  clues: (number | null)[][];
};

export type FlowPairEnd = { row: number; col: number };

export type FlowPuzzle = PuzzleBase & {
  type: PuzzleType.Flow;
  height: number;
  width: number;
  pairs: { number: number; ends: [FlowPairEnd, FlowPairEnd] }[];
};

export type Puzzle = HanjiPuzzle | HashiPuzzle | MinesweeperPuzzle | SlitherlinkPuzzle | FlowPuzzle;

/**
 * Maps the graphql puzzle fragment type to the expected {@link Puzzle} type
 */
export function mapToPuzzle(data: FragmentType<typeof PuzzleFragmentFragmentDoc>): Puzzle {
  const puzzle = getFragmentData(PuzzleFragmentFragmentDoc, data);
  const { id, name, description, attempt: puzzleAttempt, __typename, dailyChallenge } = puzzle;

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
    dailyChallenge: mapToDailyChallenge(dailyChallenge),
    name,
    description: description ?? null,
    attempt,
  };

  switch (__typename) {
    case 'HanjiPuzzle': {
      const hanji = getFragmentData(HanjiPuzzleFragmentFragmentDoc, puzzle);
      return {
        ...shared,
        type: PuzzleType.Hanji,
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
        type: PuzzleType.Hashi,
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
        type: PuzzleType.Minesweeper,
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
    case 'SlitherlinkPuzzle': {
      const slitherlink = getFragmentData(SlitherlinkPuzzleFragmentFragmentDoc, puzzle);
      const result: SlitherlinkPuzzle = {
        ...shared,
        type: PuzzleType.Slitherlink,
        height: slitherlink.height,
        width: slitherlink.width,
        clues: slitherlink.clues,
      };
      return result;
    }
    case 'FlowPuzzle': {
      const flow = getFragmentData(FlowPuzzleFragmentFragmentDoc, puzzle);
      return {
        ...shared,
        type: PuzzleType.Flow,
        height: flow.height,
        width: flow.width,
        pairs: flow.pairs.map((p) => ({
          number: p.number,
          ends: [p.ends[0], p.ends[1]].map((e) => ({ row: e.row, col: e.col })) as [
            FlowPairEnd,
            FlowPairEnd,
          ],
        })),
      };
    }
  }
}

function mapToDailyChallenge(data: PuzzleFragmentFragment['dailyChallenge']): {
  id: string;
  date: Date;
} {
  if (data.__typename !== 'PuzzleDailyChallengeSuccess') {
    throw new Error('Daily challenge not found');
  }

  return data.data;
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

/** Unmasked fragment data for SlitherlinkPuzzle. Keep in sync with PuzzleFragment + SlitherlinkPuzzleFragment. */
export type SlitherlinkPuzzleFragmentData = PuzzleBaseFragmentData &
  FragmentData<SlitherlinkPuzzleFragmentFragment> & {
    __typename: 'SlitherlinkPuzzle';
  };

/** Unmasked fragment data for FlowPuzzle. Keep in sync with PuzzleFragment + FlowPuzzleFragment. */
export type FlowPuzzleFragmentData = PuzzleBaseFragmentData &
  FragmentData<FlowPuzzleFragmentFragment> & {
    __typename: 'FlowPuzzle';
  };

/** Union of all puzzle fragment data shapes (unmasked). */
export type PuzzleFragmentData =
  | HanjiPuzzleFragmentData
  | HashiPuzzleFragmentData
  | MinesweeperPuzzleFragmentData
  | SlitherlinkPuzzleFragmentData
  | FlowPuzzleFragmentData;

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
    dailyChallenge: {
      __typename: 'PuzzleDailyChallengeSuccess',
      data: {
        __typename: 'DailyChallenge',
        id: puzzle.dailyChallenge.id,
        date: puzzle.dailyChallenge.date,
      },
    },
  };

  switch (puzzle.type) {
    case PuzzleType.Hanji: {
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
    case PuzzleType.Hashi: {
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
    case PuzzleType.Minesweeper: {
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
    case PuzzleType.Slitherlink: {
      const data: SlitherlinkPuzzleFragmentData = {
        __typename: 'SlitherlinkPuzzle',
        ...base,
        width: puzzle.width,
        height: puzzle.height,
        clues: puzzle.clues,
      };
      return data as PuzzleQueryData;
    }
    case PuzzleType.Flow: {
      const data: FlowPuzzleFragmentData = {
        __typename: 'FlowPuzzle',
        ...base,
        width: puzzle.width,
        height: puzzle.height,
        pairs: puzzle.pairs.map((p) => ({
          number: p.number,
          ends: p.ends.map((e) => ({ row: e.row, col: e.col })),
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
