import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { createFragmentRegistry } from '@apollo/client/cache';
import { SetContextLink } from '@apollo/client/link/context';
import { relayStylePagination } from '@apollo/client/utilities';

import introspectionResult from '@/generated/apollo/fragment-matcher';
import { getToken } from '@/store/token';

export const fragmentRegistry = createFragmentRegistry();

// Set EXPO_PUBLIC_GRAPHQL_URL in EAS/build env for production (e.g. Cloudflare Worker URL).
const API_URL = process.env.EXPO_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

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
