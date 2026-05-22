import "server-only";

import { createHash, createHmac, timingSafeEqual } from "crypto";
import { logger } from "@/lib/logger";

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export function maskOperationalSecrets<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [
    key,
    /(key|token|secret|password|authorization)/i.test(key) && typeof value === "string" ? `${value.slice(0, 4)}...${value.slice(-4)}` : value
  ])) as T;
}

export function applySecurityHeaders(response: Response) {
  const headers = response.headers;
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  headers.set("content-security-policy", [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://snap.licdn.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.anthropic.com",
    "frame-ancestors 'none'"
  ].join("; "));
  return response;
}

export function rateLimit(key: string, limit = 120, windowMs = 60_000) {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  bucket.count += 1;
  return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
}

export function verifyWebhookSignature(payload: string, signature: string | null, secret: string | undefined) {
  if (!secret) return { verified: false, reason: "missing_secret" };
  if (!signature) return { verified: false, reason: "missing_signature" };
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const actual = signature.replace(/^sha256=/, "");
  const verified = safeCompare(expected, actual);
  return { verified, reason: verified ? null : "signature_mismatch" };
}

export function traceRequest(request: Request) {
  const existing = request.headers.get("x-correlation-id");
  return existing && existing.length > 8 ? existing : createHash("sha256").update(`${Date.now()}-${Math.random()}`).digest("hex").slice(0, 32);
}

export function logFailedAuth(input: { path: string; reason: string; ip?: string | null }) {
  logger.warn("failed_auth_attempt", maskOperationalSecrets(input));
}

function safeCompare(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}
