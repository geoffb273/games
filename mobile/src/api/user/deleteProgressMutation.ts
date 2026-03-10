import { useCallback } from 'react';

import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

import { DeleteProgressMutationDocument } from '@/generated/gql/graphql';

gql`
  mutation DeleteProgressMutation {
    deleteProgress {
      __typename
      ... on Error {
        message
      }
      ... on MutationDeleteProgressSuccess {
        data
      }
    }
  }
`;

export function useDeleteProgress() {
  const [mutate, { loading, error }] = useMutation(DeleteProgressMutationDocument);

  const deleteProgress = useCallback(async (): Promise<boolean> => {
    const { data } = await mutate();

    if (data?.deleteProgress.__typename !== 'MutationDeleteProgressSuccess') {
      // TODO: ERROR LOGGING
      throw new Error('Unknown error');
    }

    return data.deleteProgress.data;
  }, [mutate]);

  return {
    deleteProgress,
    isLoading: loading,
    isError: error != null,
  };
}

