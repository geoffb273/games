import { type IncomingMessage } from 'http';

import { ADMIN_SECRET } from '@/constants';
import { type User } from '@/platform/user/resource/user';
import { getUser } from '@/platform/user/service/userService';
import { verifyToken } from '@/utils/jwt';
import { lazy } from '@/utils/LazyPromise';

import { NotFoundError, UnauthorizedError } from '../errors';

export type Authorization = {
  /** True when request includes x-admin-secret header matching ADMIN_SECRET (for admin-only operations) */
  isAdmin: boolean;
  /** Currently authenticated user or null if no token is provided (or user with token could not be found) */
  user: PromiseLike<User | null>;
  /** Currently authenticated user or throws UnauthorizedError if no token is provided (or user with token could not be found) */
  expectUser: PromiseLike<User>;
};

export function buildAuthorization(req: IncomingMessage): Authorization {
  const headerSecret = req.headers['x-admin-secret'];
  const isAdmin = typeof headerSecret === 'string' && headerSecret === ADMIN_SECRET;

  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    const user = Promise.resolve(null);
    return {
      isAdmin,
      user,
      expectUser: lazy<User>(async () => {
        throw new UnauthorizedError('No token provided');
      }),
    };
  }

  const user = lazy<User | null>(async () => {
    try {
      const payload = verifyToken(token);
      return getUser({ id: payload.userId });
    } catch {
      return null;
    }
  });

  const expectUser = lazy<User>(async () => {
    const payload = verifyToken(token);
    return getUser({ id: payload.userId }).catch((error) => {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError('Token was provided but user not found');
      }
      throw error;
    });
  });

  return {
    isAdmin,
    user,
    expectUser,
  };
}
