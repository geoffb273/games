import { type User } from '@/generated/prisma/client';
import { type DailyChallengeStreak } from '@/platform/dailyChallenge/resource/dailyChallenge';
import { getDailyChallengeStreakForUser } from '@/platform/dailyChallenge/service/dailyChallengeService';
import { type AuthPayload } from '@/platform/user/resource/user';
import { builder } from '@/schema/builder';

export const DailyChallengeStreakRef = builder
  .objectRef<DailyChallengeStreak>('DailyChallengeStreak')
  .implement({
    fields: (t) => ({
      current: t.exposeInt('current', { nullable: false }),
      max: t.exposeInt('max', { nullable: false }),
    }),
  });

export const AuthenticatedUserRef = builder.objectRef<User>('AuthenticatedUser').implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    dailyChallengeStreak: t.field({
      type: DailyChallengeStreakRef,
      nullable: false,
      resolve: async ({ id }, _args, { logger }) =>
        getDailyChallengeStreakForUser({ userId: id, logger }),
    }),
  }),
});

export const AuthPayloadRef = builder.objectRef<AuthPayload>('AuthPayload').implement({
  fields: (t) => ({
    token: t.exposeString('token', { nullable: false }),
  }),
});
