import React, { useEffect, useState } from 'react';

import { useAuthenticateDevice } from '@/api/user/authenticateDeviceMutation';
import { AuthContext, type AuthContextType } from '@/context/AuthContext';
import { getOrCreateDeviceId } from '@/store/device';
import { loadToken, saveToken } from '@/store/token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state] = useState<AuthContextType>({ isReady: false, userId: null });
  const { authenticateDevice } = useAuthenticateDevice();

  useEffect(() => {
    async function bootstrap() {
      const existingToken = await loadToken();

      if (existingToken) {
        return;
      }

      const deviceId = await getOrCreateDeviceId();

      const newToken = await authenticateDevice({
        deviceId,
      });

      await saveToken(newToken);
    }

    bootstrap();
  }, [authenticateDevice]);

  if (!state.isReady) return null;

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
