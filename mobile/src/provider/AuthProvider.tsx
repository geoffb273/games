import React, { useEffect, useMemo, useState } from 'react';

import { useAuthenticateDevice } from '@/api/user/authenticateDeviceMutation';
import { useCurrentUserQuery } from '@/api/user/currentUserQuer';
import { AuthContext, type AuthContextType } from '@/context/AuthContext';
import { getOrCreateDeviceId } from '@/store/device';
import { loadToken, saveToken, useAuthToken } from '@/store/token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuthToken();
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const {
    authenticateDevice,
    isLoading: isLoadingNewToken,
    isError: isErrorNewToken,
  } = useAuthenticateDevice();
  const {
    user,
    isLoading: isLoadingUser,
    isError: isErrorUser,
  } = useCurrentUserQuery({ enabled: !!token });

  //Loads token from storage or generates a new one if it doesn't exist
  useEffect(() => {
    async function generateToken() {
      const existingToken = await loadToken();

      if (existingToken) {
        return;
      }

      const deviceId = await getOrCreateDeviceId();

      try {
        const newToken = await authenticateDevice({
          deviceId,
        });

        await saveToken(newToken);
      } catch {
        // ERROR LOGGING
      }
    }
    setIsLoadingToken(true);
    generateToken().finally(() => {
      setIsLoadingToken(false);
    });
  }, [authenticateDevice]);

  const isLoading = isLoadingToken || isLoadingNewToken || isLoadingUser;
  const isError = isErrorNewToken || isErrorUser;

  const value: AuthContextType = useMemo(() => {
    if (isLoading) {
      return {
        user: null,
        status: 'loading',
      };
    }

    if (isError || user == null) {
      return {
        user: null,
        status: 'error',
      };
    }

    return {
      user: user,
      status: 'authenticated',
    };
  }, [user, isLoading, isError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
