import { prisma } from '@/client/prisma';
import { type User } from '@/generated/prisma/client';
import { deleteUserPuzzleAttemptsByUserId } from '@/platform/puzzle/dao/userPuzzleAttemptDao';
import { signToken } from '@/utils/jwt';

import { deleteUser, findOrCreateByDeviceId, getUser as getUserDao } from '../dao/userDao';
import { type AuthPayload } from '../resource/user';

/**
 *
 * @param id - The ID of the user to get.
 * @returns {Promise<User>}
 * @throws {NotFoundError} - If the user does not exist.
 */
export async function getUser({ id }: { id: string }): Promise<User> {
  return getUserDao({ id });
}

/**
 * Given a device ID, find or create a user and return an auth payload.
 *
 * @returns {Promise<AuthPayload>}
 */
export async function authenticateDevice({ deviceId }: { deviceId: string }): Promise<AuthPayload> {
  const user = await findOrCreateByDeviceId({ deviceId });
  const token = signToken({ userId: user.id });
  return { token };
}

/**
 * Deletes a user and all of their puzzle attempts in a single transaction.
 *
 * @throws {NotFoundError} if the user does not exist
 */
export async function deleteUserProgress({ userId }: { userId: string }): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await deleteUserPuzzleAttemptsByUserId({ userId, tx });
    await deleteUser({ id: userId, tx });
  });
}
