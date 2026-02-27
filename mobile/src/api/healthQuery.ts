import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { HealthQueryDocument } from '@/generated/gql/graphql';

gql`
  query HealthQuery {
    health {
      status
      timestamp
    }
  }
`;

export function useHealthQuery() {
  const { data, loading, error, refetch } = useQuery(HealthQueryDocument, {});
  return { data, loading, error, refetch };
}
