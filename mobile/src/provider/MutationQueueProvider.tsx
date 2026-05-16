import { type ReactNode, useEffect } from 'react';

import { useApolloClient } from '@apollo/client/react';

import { processQueuedMutations } from '@/client/mutationQueue/mutationQueue';
import { subscribeIsOnline } from '@/client/networkState';
import { clearToken } from '@/store/token';

export function MutationQueueProvider({ children }: { children: ReactNode }) {
  const client = useApolloClient();

  useEffect(() => {
    const syncQueuedMutations = () =>
      processQueuedMutations({
        client,
        onDeleteProgressSynced: async () => {
          await clearToken();
          await client.clearStore();
        },
      });

    void syncQueuedMutations();

    return subscribeIsOnline((isOnline) => {
      if (isOnline) {
        void syncQueuedMutations();
      }
    });
  }, [client]);

  return children;
}
