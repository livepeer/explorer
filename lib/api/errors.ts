import { NextApiResponse } from "next";
import { z } from "zod";

import { ApiError, ErrorCode } from "./types/api-error";

export const apiError = (
  res: NextApiResponse,
  status: number,
  code: ErrorCode,
  error: string,
  details?: string
) => {
  console.error(`[API Error] ${code}: ${error}`, details ?? "");
  const response = { error, code, details } as ApiError;
  res.status(status).json(response);
  return response;
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
  return apiError(
    res,
    405,
    "METHOD_NOT_ALLOWED",
    `Method ${method} Not Allowed`
  );
};

/**
 * Validates input data against a Zod schema.
 * Returns an error response if validation fails.
 *
 * @param inputResult - The result from Zod's safeParse()
 * @param res - Next.js API response object
 * @param errorMessage - Error message to return if validation fails (e.g., "Invalid address format")
 * @returns The error response if validation failed, undefined otherwise
 */
export const validateInput = <T>(
  inputResult:
    | { success: true; data: T }
    | { success: false; error: z.ZodError<T> },
  res: NextApiResponse,
  errorMessage: string
): NextApiResponse | undefined => {
  if (!inputResult.success) {
    badRequest(
      res,
      errorMessage,
      inputResult.error.issues.map((e) => e.message).join(", ")
    );
    return res;
  }
  return undefined;
};

/**
 * Validates output data against a Zod schema.
 * In development, returns an error response if validation fails.
 * In production, logs the error but allows execution to continue.
 *
 * @param outputResult - The result from Zod's safeParse()
 * @param res - Next.js API response object
 * @param endpointName - Name of the endpoint for logging (e.g., "api/account-balance")
 * @returns The error response if validation failed in development, undefined otherwise
 */
export const validateOutput = <T>(
  outputResult:
    | { success: true; data: T }
    | { success: false; error: z.ZodError<T> },
  res: NextApiResponse,
  endpointName: string
): NextApiResponse | undefined => {
  if (!outputResult.success) {
    console.error(
      `[${endpointName}] Output validation failed:`,
      outputResult.error
    );
    // In production, we might still return the data, but log the error
    // In development, this helps catch contract/API changes early
    if (process.env.NODE_ENV === "development") {
      internalError(
        res,
        new Error(
          `Output validation failed: ${outputResult.error.issues
            .map((e) => e.message)
            .join(", ")}`
        )
      );
      return res;
    }
  }
  return undefined;
};
