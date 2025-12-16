/**
 * Apollo Client Configuration
 *
 * Connects to the GraphQL API.
 * In development: http://localhost:4000/graphql
 * In production: Set via VITE_API_URL environment variable
 */

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// Support both VITE_API_URL (new) and VITE_GRAPHQL_URL (legacy) for backwards compatibility
const apiUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_GRAPHQL_URL ||
  'http://localhost:4000/graphql';

const httpLink = new HttpLink({
  uri: apiUrl,
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

