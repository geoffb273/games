import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { createFragmentRegistry } from '@apollo/client/cache';
import { SetContextLink } from '@apollo/client/link/context';
import { relayStylePagination } from '@apollo/client/utilities';

import introspectionResult from '@/generated/apollo/fragment-matcher';
import { getToken } from '@/store/token';

export const fragmentRegistry = createFragmentRegistry();

const API_URL = 'https://api.game-brain.net/graphql';

const httpLink = new HttpLink({ uri: API_URL });

const authLink = new SetContextLink(({ headers }) => {
  const token = getToken();
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

const client = new ApolloClient({
  cache: new InMemoryCache({
    possibleTypes: introspectionResult.possibleTypes,
    typePolicies: {
      Query: {
        fields: {
          dailyChallenges: relayStylePagination(),
        },
      },
    },
    fragments: fragmentRegistry,
  }),
  link: authLink.concat(httpLink),
});

export default client;
