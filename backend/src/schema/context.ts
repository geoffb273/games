import { type IncomingMessage } from 'http';

import { type User } from '@/platform/user/resource/user';
import { getUser } from '@/platform/user/service/userService';
import { isNotFoundError } from '@/utils/errorUtils';
import { verifyToken } from '@/utils/jwt';
import { lazy } from '@/utils/LazyPromise';

import { UnauthorizedError } from './errors';

export type Context = { user: PromiseLike<User | null>; expectUser: PromiseLike<User> };

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
      if (isNotFoundError(error)) {
        throw new UnauthorizedError('Invalid token');
      }
      throw error;
    });
  });

  return { user, expectUser };
}
