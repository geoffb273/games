import { type IncomingMessage } from 'http';

import { type User } from '@/platform/user/resource/user';
import { getUser } from '@/platform/user/service/userService';
import { verifyToken } from '@/utils/jwt';
import { lazy } from '@/utils/LazyPromise';

import { NotFoundError, UnauthorizedError } from './errors';

export type Context = {
  /** Currently authenticated user or null if no token is provided (or user with token could not be found) */
  user: PromiseLike<User | null>;
  /** Currently authenticated user or throws UnauthorizedError if no token is provided (or user with token could not be found) */
  expectUser: PromiseLike<User>;
};

export async function buildContext(req: IncomingMessage): Promise<Context> {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return {
      user: Promise.resolve(null),
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

  return { user, expectUser };
}
