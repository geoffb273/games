import { type User } from '@/generated/prisma/client';
import { type AuthPayload } from '@/platform/user/resource/user';
import { builder } from '@/schema/builder';

export const UserRef = builder.objectRef<User>('User').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
  }),
});

export const AuthPayloadRef = builder.objectRef<AuthPayload>('AuthPayload').implement({
  fields: (t) => ({
    token: t.exposeString('token', { nullable: false }),
  }),
});
