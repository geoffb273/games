import { type User } from '@/generated/prisma/client';
import { signToken } from '@/utils/jwt';

import { findOrCreateByDeviceId, getUser as getUserDao } from '../dao/userDao';
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
