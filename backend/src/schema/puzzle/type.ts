import { type Puzzle, PuzzleType } from '@/platform/puzzle/resource/puzzle';

import { builder } from '../builder';

export const PuzzleRef = builder.interfaceRef<Puzzle>('Puzzle').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    description: t.exposeString('description'),
  }),
});

export const HanjiPuzzleRef = builder.objectRef<Puzzle>('HanjiPuzzle').implement({
  interfaces: [PuzzleRef],
  isTypeOf: (source: unknown): source is Puzzle => (source as Puzzle).type === PuzzleType.HANJI,
});

export const HashiPuzzleRef = builder.objectRef<Puzzle>('HashiPuzzle').implement({
  interfaces: [PuzzleRef],
  isTypeOf: (source: unknown): source is Puzzle => (source as Puzzle).type === PuzzleType.HASHI,
});

export const MinesweeperPuzzleRef = builder.objectRef<Puzzle>('MinesweeperPuzzle').implement({
  interfaces: [PuzzleRef],
  isTypeOf: (source: unknown): source is Puzzle =>
    (source as Puzzle).type === PuzzleType.MINESWEEPER,
});
