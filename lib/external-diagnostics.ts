import { env } from "@/lib/env";

export function getSupabaseRestUrl(table?: string) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL) return "supabase:not-configured";
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table ?? ""}`;
}

export function getErrorDiagnostics(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  return {
    name: "UnknownError",
    message: String(error),
    stack: null
  };
}

export function redactPayload<T extends Record<string, unknown>>(payload: T) {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    redacted[key] = /email|phone|password|token|key|secret/i.test(key) ? "[redacted]" : value;
  }
  return redacted;
}

export function supabaseErrorContext(input: {
  table: string;
  operation: string;
  payload?: Record<string, unknown>;
  error: unknown;
}) {
  const maybeError = input.error as { message?: string; code?: string; details?: string; hint?: string; status?: number };
  return {
    service: "supabase",
    url: getSupabaseRestUrl(input.table),
    operation: input.operation,
    requestPayload: input.payload ? redactPayload(input.payload) : undefined,
    responseStatus: maybeError.status ?? maybeError.code ?? "unknown",
    responseBody: {
      message: maybeError.message,
      details: maybeError.details,
      hint: maybeError.hint
    },
    error: getErrorDiagnostics(input.error)
  };
}
