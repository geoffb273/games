import { type DailyChallenge } from '@/platform/dailyChallenge/resource/dailyChallenge';

import { builder } from '../builder';

export const DailyChallengeRef = builder.objectRef<DailyChallenge>('DailyChallenge').implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    date: t.expose('date', { type: 'DateTime', nullable: false }),
    puzzleCount: t.field({
      type: 'Int',
      nullable: false,
      resolve: (dailyChallenge, _args, { dataloaders: { dailyChallengePuzzleCount } }) =>
        dailyChallengePuzzleCount.load(dailyChallenge.id),
    }),
    completedPuzzleCount: t.field({
      type: 'Int',
      nullable: false,
      resolve: (dailyChallenge, _args, { dataloaders: { dailyChallengeCompletedPuzzleCount } }) =>
        dailyChallengeCompletedPuzzleCount.load(dailyChallenge.id),
    }),
  }),
});
