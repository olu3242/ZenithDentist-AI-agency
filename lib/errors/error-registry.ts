import type { ErrorCategory, ErrorSeverity, ZenithError } from "./error-types";
import { ERROR_CODES, type ErrorCode } from "./error-codes";
import { logger } from "@/lib/logger";

interface ErrorBlueprint {
  category: ErrorCategory;
  severity: ErrorSeverity;
  messageTemplate: string;
  recoverySuggestion: string;
  recoverable: boolean;
  retryable: boolean;
}

const ERROR_BLUEPRINTS: Partial<Record<ErrorCode, ErrorBlueprint>> = {
  [ERROR_CODES.AUTH_SESSION_EXPIRED]:   { category: "AUTH_ERROR",          severity: "warning",  messageTemplate: "User session has expired. Please sign in again.",           recoverySuggestion: "Redirect to /login",                              recoverable: true,  retryable: false },
  [ERROR_CODES.AUTH_INSUFFICIENT_ROLE]: { category: "AUTH_ERROR",          severity: "warning",  messageTemplate: "Insufficient role to perform this action.",                recoverySuggestion: "Contact your organization owner to adjust permissions.", recoverable: false, retryable: false },
  [ERROR_CODES.AUTH_TENANT_MISMATCH]:   { category: "AUTH_ERROR",          severity: "critical", messageTemplate: "Organization context mismatch.",                           recoverySuggestion: "Sign out and sign in to the correct organization.",  recoverable: true,  retryable: false },
  [ERROR_CODES.DB_TABLE_MISSING]:       { category: "DATABASE_ERROR",      severity: "critical", messageTemplate: "Required database table is unavailable.",                  recoverySuggestion: "Run pending migrations via supabase db push.",        recoverable: false, retryable: false },
  [ERROR_CODES.DB_RLS_VIOLATION]:       { category: "DATABASE_ERROR",      severity: "critical", messageTemplate: "Row-level security policy prevented access.",             recoverySuggestion: "Verify organization membership and RLS policies.",   recoverable: false, retryable: false },
  [ERROR_CODES.DB_NULL_TENANT]:         { category: "DATABASE_ERROR",      severity: "critical", messageTemplate: "Organization context is missing from database query.",     recoverySuggestion: "Ensure organization_id is passed through all calls.", recoverable: false, retryable: false },
  [ERROR_CODES.DB_CONNECTION_FAILED]:   { category: "DATABASE_ERROR",      severity: "fatal",    messageTemplate: "Database connection failed.",                              recoverySuggestion: "Check Supabase service health and credentials.",      recoverable: true,  retryable: true  },
  [ERROR_CODES.API_RATE_LIMITED]:       { category: "API_ERROR",           severity: "warning",  messageTemplate: "API rate limit reached.",                                  recoverySuggestion: "Wait 60 seconds and retry.",                         recoverable: true,  retryable: true  },
  [ERROR_CODES.API_TIMEOUT]:            { category: "API_ERROR",           severity: "warning",  messageTemplate: "API request timed out.",                                   recoverySuggestion: "Retry the operation.",                               recoverable: true,  retryable: true  },
  [ERROR_CODES.RT_WORKFLOW_FAILED]:     { category: "RUNTIME_ERROR",       severity: "critical", messageTemplate: "Workflow execution failed.",                               recoverySuggestion: "Check automation_traces for details. Replay from Mission Control.", recoverable: true, retryable: true },
  [ERROR_CODES.RT_EVENT_FABRIC_DOWN]:   { category: "RUNTIME_ERROR",       severity: "fatal",    messageTemplate: "Event Fabric is unavailable.",                             recoverySuggestion: "Check runtime_event_fabric_events table and service health.", recoverable: true, retryable: true },
  [ERROR_CODES.WF_NOT_FOUND]:           { category: "WORKFLOW_ERROR",      severity: "warning",  messageTemplate: "Workflow definition not found.",                           recoverySuggestion: "Verify the workflow ID in the automation registry.", recoverable: false, retryable: false },
  [ERROR_CODES.AI_INFERENCE_FAILED]:    { category: "AI_ERROR",            severity: "critical", messageTemplate: "AI inference request failed.",                             recoverySuggestion: "Check Anthropic API key and service status.",         recoverable: true,  retryable: true  },
  [ERROR_CODES.AI_MODEL_UNAVAILABLE]:   { category: "AI_ERROR",            severity: "critical", messageTemplate: "AI model is temporarily unavailable.",                    recoverySuggestion: "Retry in 30 seconds or switch to fallback model.",   recoverable: true,  retryable: true  },
  [ERROR_CODES.CFG_ENV_MISSING]:        { category: "CONFIGURATION_ERROR", severity: "fatal",    messageTemplate: "Required environment variable is not configured.",         recoverySuggestion: "Add the missing environment variable to .env.local.", recoverable: false, retryable: false },
  [ERROR_CODES.VAL_INVALID_INPUT]:      { category: "VALIDATION_ERROR",    severity: "info",     messageTemplate: "Invalid input provided.",                                  recoverySuggestion: "Review and correct the submitted values.",            recoverable: true,  retryable: false },
  [ERROR_CODES.UNKNOWN]:                { category: "UNKNOWN_ERROR",       severity: "critical", messageTemplate: "An unexpected error occurred.",                            recoverySuggestion: "Check server logs and contact support if this persists.", recoverable: true, retryable: true },
};

export function createError(
  code: ErrorCode,
  overrides: Partial<Omit<ZenithError, "code" | "timestamp">> & { cause?: string } = {}
): ZenithError {
  const blueprint = ERROR_BLUEPRINTS[code] ?? ERROR_BLUEPRINTS[ERROR_CODES.UNKNOWN]!;
  const error: ZenithError = {
    code,
    category: overrides.category ?? blueprint.category,
    severity: overrides.severity ?? blueprint.severity,
    message: overrides.message ?? blueprint.messageTemplate,
    cause: overrides.cause,
    component: overrides.component,
    route: overrides.route,
    organizationId: overrides.organizationId,
    userId: overrides.userId,
    traceId: overrides.traceId ?? generateTraceId(),
    timestamp: new Date().toISOString(),
    recoverable: overrides.recoverable ?? blueprint.recoverable,
    recoverySuggestion: overrides.recoverySuggestion ?? blueprint.recoverySuggestion,
    retryable: overrides.retryable ?? blueprint.retryable,
  };

  logger.error("zenith_error", {
    code: error.code,
    category: error.category,
    severity: error.severity,
    message: error.message,
    cause: error.cause,
    component: error.component,
    route: error.route,
    organizationId: error.organizationId,
    traceId: error.traceId,
  });

  return error;
}

export function classifyDatabaseError(rawMessage: string, context?: Partial<ZenithError>): ZenithError {
  const msg = rawMessage.toLowerCase();
  if (msg.includes("relation") && msg.includes("does not exist")) {
    const tableMatch = rawMessage.match(/relation "([^"]+)" does not exist/i);
    return createError(ERROR_CODES.DB_TABLE_MISSING, {
      ...context,
      message: tableMatch ? `Missing table: ${tableMatch[1]}. Run pending migrations.` : rawMessage,
      cause: rawMessage,
    });
  }
  if (msg.includes("column") && msg.includes("does not exist")) {
    return createError(ERROR_CODES.DB_COLUMN_MISSING, { ...context, cause: rawMessage });
  }
  if (msg.includes("row-level security") || msg.includes("rls") || msg.includes("policy")) {
    return createError(ERROR_CODES.DB_RLS_VIOLATION, { ...context, cause: rawMessage });
  }
  if (msg.includes("foreign key") || msg.includes("violates foreign key")) {
    return createError(ERROR_CODES.DB_FK_VIOLATION, { ...context, cause: rawMessage });
  }
  if (msg.includes("connection") || msg.includes("econnrefused") || msg.includes("connect")) {
    return createError(ERROR_CODES.DB_CONNECTION_FAILED, { ...context, cause: rawMessage });
  }
  return createError(ERROR_CODES.UNKNOWN, { ...context, cause: rawMessage, category: "DATABASE_ERROR" });
}

export function classifyError(err: unknown, context?: Partial<ZenithError>): ZenithError {
  if (isZenithError(err)) return err as ZenithError;
  const message = err instanceof Error ? err.message : String(err);
  const msg = message.toLowerCase();
  if (msg.includes("relation") || msg.includes("column") || msg.includes("rls") || msg.includes("foreign key")) {
    return classifyDatabaseError(message, context);
  }
  if (msg.includes("session") || msg.includes("unauthorized") || msg.includes("jwt") || msg.includes("auth")) {
    return createError(ERROR_CODES.AUTH_SESSION_EXPIRED, { ...context, cause: message });
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return createError(ERROR_CODES.API_TIMEOUT, { ...context, cause: message });
  }
  if (msg.includes("rate limit") || msg.includes("429")) {
    return createError(ERROR_CODES.API_RATE_LIMITED, { ...context, cause: message });
  }
  if (msg.includes("workflow")) {
    return createError(ERROR_CODES.RT_WORKFLOW_FAILED, { ...context, cause: message });
  }
  if (msg.includes("anthropic") || msg.includes("claude") || msg.includes("inference")) {
    return createError(ERROR_CODES.AI_INFERENCE_FAILED, { ...context, cause: message });
  }
  return createError(ERROR_CODES.UNKNOWN, { ...context, cause: message });
}

function generateTraceId(): string {
  return `trace_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function isZenithError(e: unknown): e is ZenithError {
  return typeof e === "object" && e !== null && "code" in e && "category" in e;
}
