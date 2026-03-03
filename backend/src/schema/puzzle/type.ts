import { type Puzzle, PuzzleType } from '@/platform/puzzle/resource/puzzle';
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
