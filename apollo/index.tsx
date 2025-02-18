import { ApolloClient, InMemoryCache } from "@apollo/client";

export * from "./subgraph";

const createApolloClient = () => {
  let subgraphUrl = process.env.NEXT_PUBLIC_SUBGRAPH_URL;
  
  if (!subgraphUrl) {
    throw new Error('NEXT_PUBLIC_SUBGRAPH_URL environment variable is not set');
  }

  // Ensure URL has proper scheme
  if (!subgraphUrl.startsWith('http://') && !subgraphUrl.startsWith('https://')) {
    subgraphUrl = `https://${subgraphUrl}`;
  }

  return new ApolloClient({
    uri: subgraphUrl,
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            // Add cache policies for your queries if needed
          }
        }
      }
    }),
    defaultOptions: {
      query: {
        fetchPolicy: "no-cache",
      },
      watchQuery: {
        fetchPolicy: "no-cache",
      }
    },
  });
};

// Client-side usage
export const useApollo = () => {
  return createApolloClient();
};

// Server-side usage
export const getApollo = () => {
  return createApolloClient();
};

export default useApollo;
