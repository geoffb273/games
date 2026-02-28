import { createContext, use } from 'react';

export type AuthContextType = {
  isReady: boolean;
  userId: string | null;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = use(AuthContext);

  if (context == null) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}
