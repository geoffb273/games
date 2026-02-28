import { type User } from '@/generated/prisma/client';
import { builder } from '@/schema/builder';

export const UserRef = builder.objectRef<User>('User').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
  }),
});
