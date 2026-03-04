import { getLatestDailyChallenge } from '@/platform/dailyChallenge/service/dailyChallengeService';
import { getPuzzle, getPuzzlesByDailyChallenge } from '@/platform/puzzle/service/puzzleService';

import { builder } from '../builder';
import { NotFoundError, UnknownError } from '../errors';
import { PuzzleRef } from './type';

builder.queryField('puzzle', (t) =>
  t.fieldWithInput({
    type: PuzzleRef,
    nullable: false,
    input: {
      id: t.input.id({ required: true }),
    },
    errors: {
      types: [UnknownError, NotFoundError],
    },
    resolve: async (_, { input: { id } }) => {
      return getPuzzle({ id });
    },
  }),
);

builder.queryField('puzzles', (t) =>
  t.fieldWithInput({
    type: [PuzzleRef],
    nullable: false,
    input: {
      dailyChallengeId: t.input.string({
        required: false,
        description:
          'The ID of the daily challenge to get puzzles for. If not provided, the latest daily challenge will be used.',
      }),
    },
    errors: {
      types: [UnknownError, NotFoundError],
    },
    resolve: async (_, { input: { dailyChallengeId } }) => {
      const id = dailyChallengeId ?? (await getLatestDailyChallenge()).id;

      return getPuzzlesByDailyChallenge({
        dailyChallengeId: id,
      });
    },
  }),
);
