import { prisma } from '@/client/prisma';
import { type Prisma, type User } from '@/generated/prisma';
import { NotFoundError } from '@/schema/errors';
import { isNotFoundError } from '@/utils/errorUtils';

const USER_SELECT = {
  id: true,
} satisfies Prisma.UserSelect;

/**
 * Get a user by their ID.
 *
 * @returns {Promise<User>}
 * @throws {NotFoundError} if the user does not exist
 */
export async function getUser({ id }: { id: string }): Promise<User> {
  return prisma.user
    .findUniqueOrThrow({
      where: { id },
      select: USER_SELECT,
    })
    .catch((error) => {
      if (isNotFoundError(error)) {
        throw new NotFoundError('User with the provided ID does not exist');
      }
      throw error;
    });
}
