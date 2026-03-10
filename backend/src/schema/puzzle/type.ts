import {
  type FlowPuzzle,
  type HanjiPuzzle,
  type HashiPuzzle,
  type MinesweeperPuzzle,
  type Puzzle,
  PuzzleType,
  type SlitherlinkPuzzle,
} from '@/platform/puzzle/resource/puzzle';
import { type UserPuzzleAttempt } from '@/platform/puzzle/resource/userPuzzleAttempt';
import { computeSolutionCells } from '@/utils/puzzle/minesweeper';

import { builder } from '../builder';

export const PuzzleAttemptRef = builder.objectRef<UserPuzzleAttempt>('PuzzleAttempt').implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    startedAt: t.expose('startedAt', { type: 'DateTime', nullable: false }),
    completedAt: t.expose('completedAt', { type: 'DateTime', nullable: true }),
    durationMs: t.exposeInt('durationMs', { nullable: true }),
  }),
});

export const PuzzleTypeEnum = builder.enumType('PuzzleType', {
  values: Object.values(PuzzleType),
});

export const PuzzleRef = builder.interfaceRef<Puzzle>('Puzzle').implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    name: t.exposeString('name', { nullable: false }),
    description: t.exposeString('description', { nullable: true }),
    attempt: t.field({
      type: PuzzleAttemptRef,
      nullable: true,
      resolve: (puzzle, _args, { dataloaders: { userPuzzleAttempt } }) =>
        userPuzzleAttempt.load(puzzle.id),
    }),
  }),
});

// --- Flow types ---

const FlowCellRef = builder.simpleObject('FlowCell', {
  fields: (t) => ({
    row: t.int({ nullable: false }),
    col: t.int({ nullable: false }),
  }),
});

const FlowPairRef = builder.simpleObject('FlowPair', {
  fields: (t) => ({
    number: t.int({ nullable: false }),
    ends: t.field({
      type: [FlowCellRef],
      nullable: false,
    }),
  }),
});

export const FlowPuzzleRef = builder.objectRef<FlowPuzzle>('FlowPuzzle').implement({
  interfaces: [PuzzleRef],
  isTypeOf: (source: unknown): source is FlowPuzzle => (source as Puzzle).type === PuzzleType.FLOW,
  fields: (t) => ({
    width: t.int({ nullable: false, resolve: (puzzle) => puzzle.data.width }),
    height: t.int({ nullable: false, resolve: (puzzle) => puzzle.data.height }),
    pairs: t.field({
      type: [FlowPairRef],
      nullable: false,
      resolve: (puzzle) => puzzle.data.pairs,
    }),
  }),
});

// --- Hanji types ---

export const HanjiPuzzleRef = builder.objectRef<HanjiPuzzle>('HanjiPuzzle').implement({
  interfaces: [PuzzleRef],
  isTypeOf: (source: unknown): source is HanjiPuzzle =>
    (source as Puzzle).type === PuzzleType.HANJI,
  fields: (t) => ({
    width: t.int({ nullable: false, resolve: (puzzle) => puzzle.data.width }),
    height: t.int({ nullable: false, resolve: (puzzle) => puzzle.data.height }),
    rowClues: t.field({
      type: [t.listRef('Int')],
      nullable: false,
      resolve: (puzzle) => puzzle.data.rowClues,
    }),
    colClues: t.field({
      type: [t.listRef('Int')],
      nullable: false,
      resolve: (puzzle) => puzzle.data.colClues,
    }),
  }),
});

// --- Hashi types ---

const HashiIslandRef = builder.simpleObject('HashiIsland', {
  fields: (t) => ({
    row: t.int({ nullable: false }),
    col: t.int({ nullable: false }),
    requiredBridges: t.int({ nullable: false }),
  }),
});

export const HashiPuzzleRef = builder.objectRef<HashiPuzzle>('HashiPuzzle').implement({
  interfaces: [PuzzleRef],
  isTypeOf: (source: unknown): source is HashiPuzzle =>
    (source as Puzzle).type === PuzzleType.HASHI,
  fields: (t) => ({
    width: t.int({ nullable: false, resolve: (puzzle) => puzzle.data.width }),
    height: t.int({ nullable: false, resolve: (puzzle) => puzzle.data.height }),
    islands: t.field({
      type: [HashiIslandRef],
      nullable: false,
      resolve: (puzzle) => puzzle.data.islands,
    }),
  }),
});

// --- Hashi input types ---
export const HashiCoordinateInput = builder.inputType('HashiCoordinateInput', {
  fields: (t) => ({
    row: t.int({ required: true }),
    col: t.int({ required: true }),
  }),
});

export const HashiBridgeInput = builder.inputType('HashiBridgeInput', {
  fields: (t) => ({
    from: t.field({ type: HashiCoordinateInput, required: true }),
    to: t.field({ type: HashiCoordinateInput, required: true }),
    bridges: t.int({ required: true }),
  }),
});

// --- Minesweeper types ---

export const MinesweeperCellValueEnum = builder.enumType('MinesweeperCellValue', {
  values: {
    ZERO: { value: '0' },
    ONE: { value: '1' },
    TWO: { value: '2' },
    THREE: { value: '3' },
    FOUR: { value: '4' },
    FIVE: { value: '5' },
    SIX: { value: '6' },
    SEVEN: { value: '7' },
    EIGHT: { value: '8' },
    MINE: { value: 'MINE' },
  } as const,
});

const MinesweeperRevealedCellRef = builder.simpleObject('MinesweeperRevealedCell', {
  fields: (t) => ({
    row: t.int({ nullable: false }),
    col: t.int({ nullable: false }),
    value: t.int({ nullable: false }),
  }),
});

export const MinesweeperPuzzleRef = builder
  .objectRef<MinesweeperPuzzle>('MinesweeperPuzzle')
  .implement({
    interfaces: [PuzzleRef],
    isTypeOf: (source: unknown): source is MinesweeperPuzzle =>
      (source as Puzzle).type === PuzzleType.MINESWEEPER,
    fields: (t) => ({
      width: t.int({ nullable: false, resolve: (puzzle) => puzzle.data.width }),
      height: t.int({ nullable: false, resolve: (puzzle) => puzzle.data.height }),
      mineCount: t.int({ nullable: false, resolve: (puzzle) => puzzle.data.mineCount }),
      revealedCells: t.field({
        type: [MinesweeperRevealedCellRef],
        nullable: false,
        resolve: (puzzle) => puzzle.data.revealedCells,
      }),
      mineField: t.field({
        type: [t.listRef(MinesweeperCellValueEnum)],
        nullable: false,
        resolve: (puzzle) => {
          const { width, height, solution } = puzzle.data;
          return computeSolutionCells(solution, width, height);
        },
      }),
    }),
  });

// --- Slitherlink types ---

export const SlitherlinkPuzzleRef = builder
  .objectRef<SlitherlinkPuzzle>('SlitherlinkPuzzle')
  .implement({
    interfaces: [PuzzleRef],
    isTypeOf: (source: unknown): source is SlitherlinkPuzzle =>
      (source as Puzzle).type === PuzzleType.SLITHERLINK,
    fields: (t) => ({
      width: t.int({ nullable: false, resolve: (puzzle) => puzzle.data.width }),
      height: t.int({ nullable: false, resolve: (puzzle) => puzzle.data.height }),
      clues: t.field({
        type: [t.listRef('Int', { nullable: true })],
        nullable: false,
        resolve: (puzzle) => puzzle.data.clues,
      }),
    }),
  });

// --- Slitherlink input types ---

export const SlitherlinkSolutionInput = builder.inputType('SlitherlinkSolutionInput', {
  fields: (t) => ({
    horizontalEdges: t.field({
      type: [t.listRef('Boolean')],
      required: true,
    }),
    verticalEdges: t.field({
      type: [t.listRef('Boolean')],
      required: true,
    }),
  }),
});
