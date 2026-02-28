import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { CurrentUserDocument } from '@/generated/gql/graphql';

import { type AuthenticatedUser } from './user';

gql`
  query CurrentUser {
    currentUser {
      __typename
      ... on Error {
        __typename
        message
      }
      ... on QueryCurrentUserSuccess {
        data {
          id
        }
      }
    }
  }
`;

type UseCurrentUserQueryResult = {
  isLoading: boolean;
  isError: boolean;
  user: AuthenticatedUser | null;
  refetch: () => void;
};

/**
 * Triggers the current auth query if enabled is true
 *
 * Assumes that the user is currently logged in (as in has a valid auth token) when triggered and returns an error if not
 */
export function useCurrentUserQuery({
  enabled,
}: {
  /** Whether to trigger the query */
  enabled: boolean;
}): UseCurrentUserQueryResult {
  const { data, loading, error, refetch } = useQuery(CurrentUserDocument, {
    skip: !enabled,
  });

  const user =
    data?.currentUser?.__typename === 'QueryCurrentUserSuccess' ? data.currentUser.data : null;

  return { isLoading: loading, isError: error != null, user, refetch };
}
