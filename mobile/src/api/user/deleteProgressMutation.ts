import { useCallback } from 'react';

import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

import { enqueueDeleteProgress } from '@/client/mutationQueue/mutationQueue';
import { isOnline } from '@/client/networkState';
import { logError } from '@/client/newRelic';
import { EVENT } from '@/constants/event';
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

export type DeleteProgressResult = { status: 'completed'; data: boolean } | { status: 'queued' };

export function useDeleteProgress() {
  const [mutate, { loading, error }] = useMutation(DeleteProgressMutationDocument);

  const deleteProgress = useCallback(async (): Promise<DeleteProgressResult> => {
    if (!isOnline()) {
      enqueueDeleteProgress();
      return { status: 'queued' };
    }

    const { data } = await mutate();

    if (data?.deleteProgress.__typename !== 'MutationDeleteProgressSuccess') {
      logError(
        { event: EVENT.DELETE_PROGRESS_ERROR },
        data?.deleteProgress.message ?? 'Unknown error',
      );
      throw new Error(data?.deleteProgress.message ?? 'Unknown error');
    }

    return { status: 'completed', data: data.deleteProgress.data };
  }, [mutate]);

  return {
    deleteProgress,
    isLoading: loading,
    isError: error != null,
  };
}
