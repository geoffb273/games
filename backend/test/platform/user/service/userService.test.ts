import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { deleteUserPuzzleAttemptsByUserId } from '@/platform/puzzle/dao/userPuzzleAttemptDao';
import {
  deleteUser,
  findOrCreateByDeviceId,
  getUser as getUserDao,
} from '@/platform/user/dao/userDao';
import {
  authenticateDevice,
  deleteUserProgress,
  getUser,
} from '@/platform/user/service/userService';
import { NotFoundError } from '@/schema/errors';
import { signToken } from '@/utils/jwt';

vi.mock('@/platform/user/dao/userDao');
vi.mock('@/platform/puzzle/dao/userPuzzleAttemptDao');
vi.mock('@/utils/jwt');

describe('userService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUser', () => {
    it('returns user from dao', async () => {
      const user = { id: randomUUID(), deviceId: randomUUID() };
      vi.mocked(getUserDao).mockResolvedValue(user);

      const result = await getUser({ id: user.id });

      expect(getUserDao).toHaveBeenCalledTimes(1);
      expect(getUserDao).toHaveBeenCalledWith({ id: user.id });
      expect(result).toEqual(user);
    });
    it('throws NotFoundError if user not found', async () => {
      const userId = randomUUID();
      vi.mocked(getUserDao).mockRejectedValue(new NotFoundError(`User ${userId} not found`));

      await expect(getUser({ id: userId })).rejects.toThrow(NotFoundError);
      expect(getUserDao).toHaveBeenCalledTimes(1);
      expect(getUserDao).toHaveBeenCalledWith({ id: userId });
    });
  });

  describe('authenticateDevice', () => {
    it('finds or creates user and returns token', async () => {
      const deviceId = randomUUID();
      const user = { id: randomUUID(), deviceId };
      const token = 'mock-jwt-token';
      vi.mocked(findOrCreateByDeviceId).mockResolvedValue(user);
      vi.mocked(signToken).mockReturnValue(token);

      const result = await authenticateDevice({ deviceId });

      expect(findOrCreateByDeviceId).toHaveBeenCalledTimes(1);
      expect(findOrCreateByDeviceId).toHaveBeenCalledWith({ deviceId });
      expect(signToken).toHaveBeenCalledTimes(1);
      expect(signToken).toHaveBeenCalledWith({ userId: user.id });
      expect(result).toEqual({ token });
    });
  });

  describe('deleteUserProgress', () => {
    it('deletes puzzle attempts then user in transaction', async () => {
      const userId = randomUUID();

      await deleteUserProgress({ userId });

      expect(deleteUserPuzzleAttemptsByUserId).toHaveBeenCalledTimes(1);
      expect(deleteUserPuzzleAttemptsByUserId).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
        }),
      );
      expect(deleteUser).toHaveBeenCalledTimes(1);
      expect(deleteUser).toHaveBeenCalledWith(expect.objectContaining({ id: userId }));
    });

    it('throws NotFoundError if user not found', async () => {
      const userId = randomUUID();
      vi.mocked(deleteUser).mockRejectedValue(new NotFoundError(`User ${userId} not found`));

      await expect(deleteUserProgress({ userId })).rejects.toThrow(NotFoundError);
      expect(deleteUser).toHaveBeenCalledTimes(1);
      expect(deleteUser).toHaveBeenCalledWith(expect.objectContaining({ id: userId }));
    });
  });
});
