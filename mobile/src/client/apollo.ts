import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

// TODO: replace with your actual GraphQL endpoint
const API_URL = 'http://localhost:4000/graphql';

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({ uri: API_URL }),
});

export default client;
