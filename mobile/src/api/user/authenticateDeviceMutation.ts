import { useCallback } from 'react';

import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

import { AuthenticateDeviceMutationDocument } from '@/generated/gql/graphql';

gql`
  mutation AuthenticateDeviceMutation($input: MutationAuthenticateDeviceInput!) {
    authenticateDevice(input: $input) {
      token
    }
  }
`;

/**
 * Returns a function used to authenticate a device and a boolean indicating if the mutation is loading
 */
export function useAuthenticateDevice() {
  const [authenticateDeviceMutation, { loading }] = useMutation(AuthenticateDeviceMutationDocument);

  /**
   * Authenticates a device and returns the token
   *
   * @returns The token if the authentication is successful, otherwise undefined
   */
  const authenticateDevice = useCallback(
    async ({ deviceId }: { deviceId: string }) => {
      const { data, error } = await authenticateDeviceMutation({
        variables: { input: { deviceId } },
      });

      if (error != null || data == null) {
        // TODO: ERROR LOGGING
        throw error ?? new Error('Unknown error');
      }

      const {
        authenticateDevice: { token },
      } = data;

      return token;
    },
    [authenticateDeviceMutation],
  );

  return { authenticateDevice, isLoading: loading };
}
