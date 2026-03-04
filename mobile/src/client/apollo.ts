import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { relayStylePagination } from '@apollo/client/utilities';

import { getToken } from '@/store/token';

// TODO: replace with your actual GraphQL endpoint
const API_URL = 'http://localhost:4000/graphql';

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
    typePolicies: {
      Query: {
        fields: {
          dailyChallenges: relayStylePagination(),
        },
      },
    },
  }),
  link: authLink.concat(httpLink),
});

export default client;
