import { authenticateDevice, deleteUserProgress } from '@/platform/user/service/userService';

import { builder } from '../builder';
import { UnauthorizedError, UnknownError } from '../errors';
import { AuthenticatedUserRef, AuthPayloadRef } from './type';

builder.queryField('currentUser', (t) =>
  t.field({
    type: AuthenticatedUserRef,
    nullable: false,
    errors: {
      types: [UnauthorizedError],
    },
    resolve: async (_root, _args, { authorization: { expectUser } }) => {
      return await expectUser;
    },
  }),
);

builder.mutationField('authenticateDevice', (t) =>
  t.fieldWithInput({
    type: AuthPayloadRef,
    nullable: false,
    input: {
      deviceId: t.input.string({ required: true }),
    },
    resolve: async (_root, { input: { deviceId } }) => {
      return authenticateDevice({ deviceId });
    },
  }),
);

builder.mutationField('deleteProgress', (t) =>
  t.field({
    type: 'Boolean',
    nullable: false,
    errors: {
      types: [UnauthorizedError, UnknownError],
    },
    resolve: async (_root, _args, { authorization: { expectUser } }) => {
      const user = await expectUser;

      await deleteUserProgress({ userId: user.id });

      return true;
    },
  }),
);
