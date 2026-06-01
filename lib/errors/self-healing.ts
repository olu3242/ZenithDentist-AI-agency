import { logger } from "@/lib/logger";
import { classifyError } from "./error-registry";
import type { ZenithError } from "./error-types";

export interface RetryPolicy {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  retryableCategories: string[];
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  delayMs: 500,
  backoffMultiplier: 2,
  retryableCategories: ["API_ERROR", "NETWORK_ERROR", "RUNTIME_ERROR", "DATABASE_ERROR"],
};

export interface CircuitBreakerState {
  service: string;
  state: "closed" | "open" | "half-open";
  failures: number;
  lastFailure: number | null;
  openedAt: number | null;
  successCount: number;
}

const circuitRegistry = new Map<string, CircuitBreakerState>();
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 60_000;

export function getCircuitState(service: string): CircuitBreakerState {
  if (!circuitRegistry.has(service)) {
    circuitRegistry.set(service, { service, state: "closed", failures: 0, lastFailure: null, openedAt: null, successCount: 0 });
  }
  return circuitRegistry.get(service)!;
}

export function recordCircuitSuccess(service: string): void {
  const cb = getCircuitState(service);
  cb.successCount++;
  if (cb.state === "half-open" && cb.successCount >= 2) {
    cb.state = "closed";
    cb.failures = 0;
    cb.successCount = 0;
    logger.info("circuit_breaker_closed", { service });
  }
}

export function recordCircuitFailure(service: string): boolean {
  const cb = getCircuitState(service);
  cb.failures++;
  cb.lastFailure = Date.now();
  cb.successCount = 0;
  if (cb.failures >= CIRCUIT_THRESHOLD && cb.state === "closed") {
    cb.state = "open";
    cb.openedAt = Date.now();
    logger.error("circuit_breaker_opened", { service, failures: cb.failures });
    return true;
  }
  return false;
}

export function isCircuitOpen(service: string): boolean {
  const cb = getCircuitState(service);
  if (cb.state === "open") {
    const elapsed = Date.now() - (cb.openedAt ?? 0);
    if (elapsed > CIRCUIT_RESET_MS) {
      cb.state = "half-open";
      logger.info("circuit_breaker_half_open", { service });
      return false;
    }
    return true;
  }
  return false;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
  context?: { service?: string; component?: string; organizationId?: string }
): Promise<T> {
  let lastError: ZenithError | null = null;
  let delay = policy.delayMs;

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      const result = await operation();
      if (context?.service) recordCircuitSuccess(context.service);
      return result;
    } catch (err) {
      const zenithErr = classifyError(err, { component: context?.component, organizationId: context?.organizationId });
      lastError = zenithErr;
      if (context?.service) recordCircuitFailure(context.service);

      if (!zenithErr.retryable || !policy.retryableCategories.includes(zenithErr.category)) {
        throw zenithErr;
      }

      if (attempt < policy.maxAttempts) {
        logger.warn("retry_attempt", { attempt, maxAttempts: policy.maxAttempts, service: context?.service, error: zenithErr.code, delayMs: delay });
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= policy.backoffMultiplier;
      }
    }
  }
  throw lastError!;
}

export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => T,
  service?: string
): Promise<T> {
  if (service && isCircuitOpen(service)) {
    logger.warn("circuit_open_using_fallback", { service });
    return fallback();
  }
  try {
    const result = await primary();
    if (service) recordCircuitSuccess(service);
    return result;
  } catch (err) {
    if (service) recordCircuitFailure(service);
    logger.warn("primary_failed_using_fallback", { service, error: err instanceof Error ? err.message : String(err) });
    return fallback();
  }
}

export function withGracefulDegradation<T>(
  primary: Promise<T>,
  fallbackValue: T,
  label: string
): Promise<T> {
  return primary.catch(err => {
    logger.warn("graceful_degradation", { label, error: err instanceof Error ? err.message : String(err) });
    return fallbackValue;
  });
}
