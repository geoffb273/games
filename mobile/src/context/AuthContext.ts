import { createContext, use } from 'react';

import { type AuthenticatedUser } from '@/api/user/user';

export type AuthStatus = 'authenticated' | 'error' | 'loading';

export type AuthContextType =
  | {
      user: AuthenticatedUser;
      status: 'authenticated';
    }
  | {
      user: null;
      status: 'error' | 'loading';
    };

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = use(AuthContext);

  if (context == null) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}
