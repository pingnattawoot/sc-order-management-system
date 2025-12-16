/**
 * Apollo Client Configuration
 *
 */

import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/graphql";

const httpLink = new HttpLink({
  uri: apiUrl,
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
    },
  },
});
