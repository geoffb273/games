import { useEffect } from 'react';

import type { OperationVariables } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

/**
 * Warms the Apollo cache (no `useQuery`
 * subscription). Pass a stable `variables` object when possible so the effect does not re-run every render.
 */
export function usePrefetchQuery<TResult, TVariables extends OperationVariables>(
  document: TypedDocumentNode<TResult, TVariables>,
  { variables, enabled = true }: { enabled?: boolean; variables: TVariables | false },
): void {
  const client = useApolloClient();

  useEffect(() => {
    if (!enabled || !variables) {
      return;
    }

    void client
      .query({
        query: document,
        variables,
        fetchPolicy: 'cache-first',
      })
      .catch(() => {
        /* best-effort prefetch; errors surface on a real read */
      });
  }, [client, document, enabled, variables]);
}
