import type { ErrorCode } from "./error-codes";

export type ErrorCategory =
  | "AUTH_ERROR"
  | "DATABASE_ERROR"
  | "API_ERROR"
  | "NETWORK_ERROR"
  | "RUNTIME_ERROR"
  | "WORKFLOW_ERROR"
  | "AI_ERROR"
  | "CONFIGURATION_ERROR"
  | "VALIDATION_ERROR"
  | "UNKNOWN_ERROR";

export type ErrorSeverity = "fatal" | "critical" | "warning" | "info";

export interface ZenithError {
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  cause?: string;
  component?: string;
  route?: string;
  organizationId?: string;
  userId?: string;
  traceId?: string;
  timestamp: string;
  recoverable: boolean;
  recoverySuggestion?: string;
  retryable: boolean;
}

export interface ZenithErrorResult<T = null> {
  ok: false;
  error: ZenithError;
  data?: T;
}

export interface ZenithSuccessResult<T> {
  ok: true;
  data: T;
  error?: never;
}

export type ZenithResult<T> = ZenithSuccessResult<T> | ZenithErrorResult<T>;

export function isZenithError(e: unknown): e is ZenithError {
  return typeof e === "object" && e !== null && "code" in e && "category" in e;
}
