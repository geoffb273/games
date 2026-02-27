import { HealthQueryDocument } from '@/generated/gql/graphql';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

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
