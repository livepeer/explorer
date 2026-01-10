import { NextApiResponse } from "next";

import { ApiError, ErrorCode } from "./types/api-error";

export const apiError = (
  res: NextApiResponse,
  status: number,
  code: ErrorCode,
  error: string,
  details?: string
): void => {
  console.error(`[API Error] ${code}: ${error}`, details ?? "");
  res.status(status).json({ error, code, details } as ApiError);
};

export const badRequest = (
  res: NextApiResponse,
  message: string,
  details?: string
) => apiError(res, 400, "VALIDATION_ERROR", message, details);

export const notFound = (
  res: NextApiResponse,
  message: string,
  details?: string
) => apiError(res, 404, "NOT_FOUND", message, details);

export const internalError = (res: NextApiResponse, err?: unknown) =>
  apiError(
    res,
    500,
    "INTERNAL_ERROR",
    "Internal server error",
    err instanceof Error ? err.message : undefined
  );

export const externalApiError = (
  res: NextApiResponse,
  service: string,
  details?: string
) =>
  apiError(
    res,
    502,
    "EXTERNAL_API_ERROR",
    `Failed to fetch from ${service}`,
    details
  );

export const methodNotAllowed = (
  res: NextApiResponse,
  method: string,
  allowed: string[]
) => {
  res.setHeader("Allow", allowed);
  apiError(res, 405, "METHOD_NOT_ALLOWED", `Method ${method} Not Allowed`);
};
