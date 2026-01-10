export interface ApiError {
  error: string;
  code: ErrorCode;
  details?: string;
}

export type ErrorCode =
  | "INTERNAL_ERROR"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "EXTERNAL_API_ERROR"
  | "METHOD_NOT_ALLOWED";
