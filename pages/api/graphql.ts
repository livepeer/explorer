import { addTypenameToDocument } from "@apollo/client/utilities";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { type DocumentNode, getOperationAST, parse, print } from "graphql";
import type { NextApiRequest, NextApiResponse } from "next";

import * as subgraph from "../../apollo/subgraph";

const MAX_REQUEST_BYTES = 64 * 1024;
const UPSTREAM_TIMEOUT_MS = 10_000;

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

const isAllowedRequest = (body: Record<string, unknown>): boolean => {
  if (isObject(body.extensions) && Object.keys(body.extensions).length > 0) {
    return false;
  }
  try {
    const name = allowedOperations.get(print(parse(body.query as string)));
    return (
      name !== undefined &&
      (body.operationName == null || body.operationName === name)
    );
  } catch {
    return false;
  }
};

export const config = {
  api: {
    bodyParser: { sizeLimit: "64kb" },
  },
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isRequest = (body: unknown): body is Record<string, unknown> =>
  isObject(body) &&
  Object.keys(body).every((key) =>
    ["query", "operationName", "variables", "extensions"].includes(key)
  ) &&
  typeof body.query === "string" &&
  body.query.trim().length > 0 &&
  (body.operationName == null || typeof body.operationName === "string") &&
  (body.variables == null || isObject(body.variables)) &&
  (body.extensions == null || isObject(body.extensions));

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

  if (!isRequest(req.body)) {
    return errorResponse(res, 400, "Invalid GraphQL request");
  }

  const body = JSON.stringify(req.body);
  if (Buffer.byteLength(body, "utf8") > MAX_REQUEST_BYTES) {
    return errorResponse(res, 413, "GraphQL request body is too large");
  }

  if (!isAllowedRequest(req.body)) {
    return errorResponse(res, 400, "Invalid GraphQL request");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    // The upstream and headers are server-controlled. Never forward caller
    // credentials, query parameters, or redirects to another destination.
    const upstream = await fetch(CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/graphql-response+json, application/json",
      },
      body,
      redirect: "error",
      credentials: "omit",
      signal: controller.signal,
    });

    const mediaType = upstream.headers
      .get("content-type")
      ?.split(";")[0]
      .trim()
      .toLowerCase();
    if (
      (upstream.status >= 300 && upstream.status < 400) ||
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
