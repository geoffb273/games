import { resolveCursorConnection, type ResolveCursorConnectionArgs } from '@pothos/plugin-relay';

import {
  createDailyChallenge as createDailyChallengeService,
  listDailyChallenges,
} from '@/platform/dailyChallenge/service/dailyChallengeService';
import { buildCursorArgs, encodeCursor } from '@/utils/paginationUtils';

import { builder } from '../builder';
import { AlreadyExistsError, UnauthorizedError } from '../errors';
import { DailyChallengeRef } from './type';

builder.queryField('dailyChallenges', (t) =>
  t.connection({
    type: DailyChallengeRef,
    resolve: (_, args) => {
      return resolveCursorConnection(
        { args, toCursor: (dc) => encodeCursor({ date: dc.date.toISOString() }) },
        ({ after, limit }: ResolveCursorConnectionArgs) => {
          const { take, skip, cursor } = buildCursorArgs({
            after,
            limit,
            parseCursor: (raw) => ({ date: new Date(raw.date) }),
          });

          return listDailyChallenges({ take, skip, cursor });
        },
      );
    },
  }),
);

builder.mutationField('createDailyChallenge', (t) =>
  t.fieldWithInput({
    description: 'Creates a daily challenge for the given date (admin only via x-admin-secret).',
    type: DailyChallengeRef,
    nullable: false,
    input: {
      date: t.input.field({
        type: 'DateTime',
        required: true,
        description: 'The date for the daily challenge (start of day).',
      }),
    },
    errors: {
      types: [AlreadyExistsError, UnauthorizedError],
    },
    resolve: async (_, { input: { date } }, { authorization }) => {
      if (!authorization.isAdmin) {
        throw new UnauthorizedError('Admin secret required');
      }
      return createDailyChallengeService({ date });
    },
  }),
);
