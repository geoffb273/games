import { resolveCursorConnection, type ResolveCursorConnectionArgs } from '@pothos/plugin-relay';

import { listDailyChallenges } from '@/platform/dailyChallenge/service/dailyChallengeService';
import { buildCursorArgs, encodeCursor } from '@/utils/paginationUtils';

import { builder } from '../builder';
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
