import { createContext, use } from 'react';

import { type AuthenticatedUser } from '@/api/user/user';

export type AuthFetchStatus = 'authenticated' | 'error' | 'loading';

export type AuthFetchContextType =
  | {
      status: 'authenticated';
      user: AuthenticatedUser;
    }
  | { status: 'error' | 'loading'; user?: never };

export const AuthFetchContext = createContext<AuthFetchContextType | undefined>(undefined);

type UseAuthFetchContextResult<T extends boolean> = T extends true
  ? Extract<AuthFetchContextType, { status: 'authenticated' }>
  : AuthFetchContextType;

export function useAuthFetchContext({
  required,
}: {
  /**  Whether the user is required to be authenticated. If true, the context will throw an error if it is not authenticated. */
  required: false;
}): UseAuthFetchContextResult<false>;
export function useAuthFetchContext({
  required,
}: {
  /**  Whether the user is required to be authenticated. If true, the context will throw an error if it is not authenticated. */
  required: true;
}): UseAuthFetchContextResult<true>;
export function useAuthFetchContext<T extends boolean>({
  required,
}: {
  /**  Whether the user is required to be authenticated. If true, the context will throw an error if it is not authenticated. */
  required: T;
}): UseAuthFetchContextResult<T> {
  const context = use(AuthFetchContext);

  if (context == null) {
    throw new Error('useAuthFetchContext must be used within an AuthFetchProvider');
  }

  if (!required) return context as UseAuthFetchContextResult<T>;

  if (context.status !== 'authenticated') {
    throw new Error('useAuthFetchContext nullable is false, but user is not authenticated');
  }

  return context;
}
