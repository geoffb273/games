import {
  type HanjiPuzzle,
  type HashiPuzzle,
  type MinesweeperPuzzle,
  type Puzzle,
  PuzzleType,
} from '@/platform/puzzle/resource/puzzle';
import { type UserPuzzleAttempt } from '@/platform/puzzle/resource/userPuzzleAttempt';

import { builder } from '../builder';

export const PuzzleAttemptRef = builder.objectRef<UserPuzzleAttempt>('PuzzleAttempt').implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    startedAt: t.expose('startedAt', { type: 'DateTime', nullable: false }),
    completedAt: t.expose('completedAt', { type: 'DateTime', nullable: true }),
    durationMs: t.exposeInt('durationMs', { nullable: true }),
  }),
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

// --- Minesweeper types ---

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
    }),
  });
