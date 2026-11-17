import { z } from "zod";

/**
 * GraphQL-over-HTTP request envelope accepted by the subgraph proxy.
 * Extensions such as persisted queries are not supported, so only an empty
 * object (or no field) is allowed.
 */
export const GraphQLRequestSchema = z.strictObject({
  query: z.string().trim().min(1),
  operationName: z.string().nullish(),
  variables: z
    .looseObject({
      first: z.int().min(0).max(1000).nullish(),
    })
    .nullish(),
  extensions: z.strictObject({}).nullish(),
});

export type GraphQLRequest = z.infer<typeof GraphQLRequestSchema>;
