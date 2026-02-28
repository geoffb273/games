import { type User } from '@/generated/prisma/client';
import { type AuthPayload } from '@/platform/user/resource/user';
import { builder } from '@/schema/builder';

export const AuthenticatedUserRef = builder.objectRef<User>('AuthenticatedUser').implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
  }),
});

export const AuthPayloadRef = builder.objectRef<AuthPayload>('AuthPayload').implement({
  fields: (t) => ({
    token: t.exposeString('token', { nullable: false }),
  }),
});
