import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useAuthenticateDevice } from '@/api/user/authenticateDeviceMutation';
import { useCurrentUserQuery } from '@/api/user/currentUserQuer';
import { AuthContext, type AuthContextType } from '@/context/AuthContext';
import { getOrCreateDeviceId } from '@/store/device';
import { clearToken, loadToken, saveToken, useAuthToken } from '@/store/token';

const MAX_RETRIES = 3;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuthToken();
  const [isLoadingToken, setIsLoadingToken] = useState(false);

  const retryAttemptsRef = useRef(0);
  const isRetryingRef = useRef(false);

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

  /** Loads token from storage or generates a new one if it doesn't exist */
  const generateToken = useCallback(async () => {
    const existingToken = await loadToken();
    if (existingToken) return;

    const deviceId = await getOrCreateDeviceId();
    const newToken = await authenticateDevice({ deviceId });
    await saveToken(newToken);
  }, [authenticateDevice]);

  // Initial attempt to load token
  useEffect(() => {
    setIsLoadingToken(true);
    generateToken().finally(() => {
      setIsLoadingToken(false);
    });
  }, [generateToken]);

  // Reset retry counter on successful auth
  useEffect(() => {
    if (user != null) {
      retryAttemptsRef.current = 0;
    }
  }, [user]);

  // On error with an existing token, clear and regenerate up to MAX_RETRIES times.
  // useLayoutEffect so refetching state is updated before paint so no error flicker
  useLayoutEffect(() => {
    if (
      token == null ||
      !isErrorUser ||
      retryAttemptsRef.current >= MAX_RETRIES ||
      isRetryingRef.current
    )
      return;

    retryAttemptsRef.current += 1;
    isRetryingRef.current = true;
    setIsLoadingToken(true);

    clearToken()
      .then(() => generateToken())
      .finally(() => {
        isRetryingRef.current = false;
        setIsLoadingToken(false);
      });
  }, [generateToken, isErrorUser, token]);

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
