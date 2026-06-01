import "server-only";
import { NextResponse } from "next/server";
import { classifyError } from "./error-registry";
import type { ZenithError } from "./error-types";

export interface APIErrorResponse {
  ok: false;
  error: {
    code: string;
    category: string;
    message: string;
    suggestion: string;
    traceId: string;
  };
}

export function errorToResponse(err: unknown, status = 500): NextResponse<APIErrorResponse> {
  const zenithErr: ZenithError = classifyError(err);
  return NextResponse.json({
    ok: false,
    error: {
      code: zenithErr.code,
      category: zenithErr.category,
      message: zenithErr.message,
      suggestion: zenithErr.recoverySuggestion ?? "Contact support.",
      traceId: zenithErr.traceId ?? "",
    },
  }, { status });
}

export function withErrorBoundary<T>(
  handler: () => Promise<NextResponse<T>>,
  context?: { route?: string; component?: string; organizationId?: string }
): Promise<NextResponse<T | APIErrorResponse>> {
  return handler().catch(err => errorToResponse(err) as NextResponse<APIErrorResponse>);
}
