import { gql } from '@apollo/client';

import { fragmentRegistry } from '@/client/apollo';
import { type FragmentType, useFragment } from '@/generated/gql';
import { UserStreakFragmentFragmentDoc } from '@/generated/gql/graphql';

const getFragmentData = useFragment;

gql`
  fragment UserStreakFragment on AuthenticatedUser {
    id
    dailyChallengeStreak {
      current
      max
    }
  }
`;

fragmentRegistry.register(UserStreakFragmentFragmentDoc);

export type AuthenticatedUser = {
  id: string;
};

export type DailyChallengeStreak = {
  current: number;
  max: number;
};

/**
 * Maps the {@link UserStreakFragmentFragmentDoc} data to the domain {@link DailyChallengeStreak} type.
 */
export function mapToUserStreak(
  data: FragmentType<typeof UserStreakFragmentFragmentDoc>,
): DailyChallengeStreak {
  const fragment = getFragmentData(UserStreakFragmentFragmentDoc, data);
  return {
    current: fragment.dailyChallengeStreak.current,
    max: fragment.dailyChallengeStreak.max,
  };
}
