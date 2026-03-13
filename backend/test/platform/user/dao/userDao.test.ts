import { afterEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '../../../../src/schema/errors';
import { prisma } from '../../../../src/client/prisma';
import {
  deleteUser,
  findOrCreateByDeviceId,
  getUser,
} from '../../../../src/platform/user/dao/userDao';
import { randomUUID } from 'crypto';
import { User } from '../../../../src/platform/user/resource/user';

async function createUser({
  id = randomUUID(),
  deviceId = randomUUID(),
}: {
  id?: string;
  deviceId?: string;
} = {}): Promise<User> {
  return prisma.user.create({
    data: {
      id,
      deviceId,
    },
  });
}

describe('userDao', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUser', () => {
    it('returns the user when found', async () => {
      const user = await createUser();

      const result = await getUser({ id: user.id });

      expect(result).toEqual(user);
    });

    it('throws NotFoundError when user does not exist', async () => {
      await expect(getUser({ id: randomUUID() })).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('findOrCreateByDeviceId', () => {
    it('finds by deviceId', async () => {
      const deviceId = randomUUID();
      const user = await createUser({ deviceId });

      const result = await findOrCreateByDeviceId({ deviceId });

      expect(result).toEqual(user);
    });

    it('creates by deviceId when user does not exist', async () => {
      const deviceId = randomUUID();
      const user = await findOrCreateByDeviceId({ deviceId });

      expect(user).toBeDefined();
      expect(user.deviceId).toEqual(deviceId);
    });
  });

  describe('deleteUser', () => {
    it('deletes by id using default tx', async () => {
      const user = await createUser();

      await deleteUser({ id: user.id });

      await expect(getUser({ id: user.id })).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws NotFoundError when user does not exist', async () => {
      await expect(deleteUser({ id: randomUUID() })).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
