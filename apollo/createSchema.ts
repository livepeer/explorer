import { wrapSchema } from "@graphql-tools/wrap";
import { getIntrospectionQuery, print } from "graphql";
import fetch from "isomorphic-unfetch";
import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from "lib/chains";

async function introspectSchema(executor: any) {
  const introspectionQuery = getIntrospectionQuery();
  const introspectionResult = await executor({
    document: introspectionQuery,
  });
  return introspectionResult.data.__schema;
}

const createSchema = async () => {
  const executor = (async ({ document, variables }) => {
    const query = print(document);
    const subgraphUrl = process.env.NEXT_PUBLIC_SUBGRAPH_URL;
    
    if (!subgraphUrl) {
      throw new Error('NEXT_PUBLIC_SUBGRAPH_URL environment variable is not set');
    }

    const fetchResult = await fetch(subgraphUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    return fetchResult.json();
  }) as any;

  const subgraphSchema = wrapSchema({
    schema: await introspectSchema(executor),
    executor,
  });

  return subgraphSchema;
};

export default createSchema;
