import { randomUUID } from 'crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { deleteUser, findOrCreateByDeviceId, getUser } from '@/platform/user/dao/userDao';
import { NotFoundError } from '@/schema/errors';
import { createTestUser } from '@/test/testUtils';

describe('userDao', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUser', () => {
    it('returns the user when found', async () => {
      const user = await createTestUser();

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
      const user = await createTestUser({ deviceId });

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
      const user = await createTestUser();

      await deleteUser({ id: user.id });

      await expect(getUser({ id: user.id })).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws NotFoundError when user does not exist', async () => {
      await expect(deleteUser({ id: randomUUID() })).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
