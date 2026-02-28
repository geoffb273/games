import { getUser } from '@/platform/user/service/userService';

import { builder } from '../builder';
import { NotFoundError } from '../errors';
import { UserRef } from './type';

builder.queryField('user', (t) =>
  t.fieldWithInput({
    type: UserRef,
    nullable: false,
    errors: {
      types: [NotFoundError],
    },
    input: {
      id: t.input.string({ required: true }),
    },
    resolve: async (_root, { input: { id } }) => {
      return getUser({ id });
    },
  }),
);
