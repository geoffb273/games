import { type User } from '@/generated/prisma/client';

import { getUser as getUserDao } from '../dao/userDao';

/**
 *
 * @param id - The ID of the user to get.
 * @returns {Promise<User>}
 */
export async function getUser({ id }: { id: string }): Promise<User> {
  return getUserDao({ id });
}
