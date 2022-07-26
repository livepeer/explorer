import { introspectSchema, wrapSchema } from "@graphql-tools/wrap";
import { print } from "graphql";
import fetch from "isomorphic-unfetch";

import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";

const createSchema = async () => {
  const executor = async ({ document, variables }) => {
    const query = print(document);
    const fetchResult = await fetch(CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    return fetchResult.json();
  };

  const subgraphSchema = wrapSchema({
    schema: await introspectSchema(executor),
    executor,
  });

  return subgraphSchema;
};

export default createSchema;
