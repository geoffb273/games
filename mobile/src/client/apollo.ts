import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { createFragmentRegistry } from '@apollo/client/cache';
import { SetContextLink } from '@apollo/client/link/context';
import { relayStylePagination } from '@apollo/client/utilities';
import { MMKVWrapper, persistCache } from 'apollo3-cache-persist';

import introspectionResult from '@/generated/apollo/fragment-matcher';
import { getStorage } from '@/storage/mmkv';
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

const cache = new InMemoryCache({
  possibleTypes: introspectionResult.possibleTypes,
  typePolicies: {
    Query: {
      fields: {
        dailyChallenges: relayStylePagination(),
      },
    },
  },
  fragments: fragmentRegistry,
});

persistCache({
  cache,
  storage: new MMKVWrapper(getStorage()),
});

export const apollo = new ApolloClient({
  cache,
  link: authLink.concat(httpLink),
});
