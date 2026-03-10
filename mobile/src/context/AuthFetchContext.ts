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

export function useAuthFetchContext() {
  const context = use(AuthFetchContext);

  if (context == null) {
    throw new Error('useAuthFetchContext must be used within an AuthFetchProvider');
  }

  return context;
}
