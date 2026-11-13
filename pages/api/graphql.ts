import { addTypenameToDocument } from "@apollo/client/utilities";
import {
  type GraphQLRequest,
  GraphQLRequestSchema,
} from "@lib/api/schemas/graphql";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { type DocumentNode, getOperationAST, parse, print } from "graphql";
import type { NextApiRequest, NextApiResponse } from "next";

import * as subgraph from "../../apollo/subgraph";

const UPSTREAM_TIMEOUT_MS = 10_000;

// Printed allowlisted document -> operation name.
const allowedOperations = new Map<string, string>();
for (const [name, value] of Object.entries(subgraph)) {
  if (!name.endsWith("Document")) continue;
  const document = value as DocumentNode;
  const operation = getOperationAST(document);
  if (operation?.operation !== "query" || !operation.name) continue;

  // Accept both checked-in queries and Apollo's automatic __typename fields.
  for (const form of [document, addTypenameToDocument(document)]) {
    allowedOperations.set(print(form), operation.name.value);
  }
}

/**
 * Returns the allowlisted document and operation name matching the request,
 * or null when the request is not an allowlisted operation.
 */
const findAllowedOperation = (
  body: GraphQLRequest
): { query: string; operationName: string } | null => {
  let query: string;
  try {
    query = print(parse(body.query));
  } catch {
    return null;
  }
  const operationName = allowedOperations.get(query);
  if (
    operationName === undefined ||
    (body.operationName != null && body.operationName !== operationName)
  ) {
    return null;
  }
  return { query, operationName };
};

export const config = {
  api: {
    bodyParser: { sizeLimit: "64kb" },
  },
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isGraphQLResponse = (body: unknown): boolean =>
  isObject(body) &&
  ("data" in body || "errors" in body) &&
  (!("data" in body) || body.data === null || isObject(body.data)) &&
  (!("errors" in body) ||
    (Array.isArray(body.errors) &&
      body.errors.length > 0 &&
      body.errors.every(
        (error) => isObject(error) && typeof error.message === "string"
      )));

const errorResponse = (res: NextApiResponse, status: number, message: string) =>
  res.status(status).json({ errors: [{ message }] });

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return errorResponse(res, 405, "Only POST requests are supported");
  }

  const contentType = req.headers["content-type"]?.split(";")[0].trim();
  if (contentType?.toLowerCase() !== "application/json") {
    return errorResponse(res, 415, "Content-Type must be application/json");
  }

  const requestResult = GraphQLRequestSchema.safeParse(req.body);
  const operation =
    requestResult.success && findAllowedOperation(requestResult.data);
  if (!requestResult.success || !operation) {
    return errorResponse(res, 400, "Invalid GraphQL request");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    // The upstream, headers and document are server-controlled: forward the
    // stored allowlisted document rather than the caller's raw body, and never
    // forward caller credentials, query parameters, or redirects.
    const upstream = await fetch(CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/graphql-response+json, application/json",
      },
      body: JSON.stringify({
        query: operation.query,
        operationName: operation.operationName,
        variables: requestResult.data.variables ?? undefined,
      }),
      redirect: "error",
      signal: controller.signal,
    });

    const mediaType = upstream.headers
      .get("content-type")
      ?.split(";")[0]
      .trim()
      .toLowerCase();
    if (
      !["application/json", "application/graphql-response+json"].includes(
        mediaType ?? ""
      )
    ) {
      return errorResponse(res, 502, "Invalid subgraph response");
    }

    const result: unknown = await upstream.json();
    if (!isGraphQLResponse(result)) {
      return errorResponse(res, 502, "Invalid subgraph response");
    }

    // Preserve partial data, GraphQL errors and their HTTP status for Apollo.
    return res.status(upstream.status).json(result);
  } catch {
    // Fetch and JSON parsing errors can contain the credential-bearing URL.
    return controller.signal.aborted
      ? errorResponse(res, 504, "Subgraph request timed out")
      : errorResponse(res, 502, "Subgraph request failed");
  } finally {
    clearTimeout(timeout);
    // Also stop an unread response body when its headers were invalid.
    controller.abort();
  }
};

export default handler;
