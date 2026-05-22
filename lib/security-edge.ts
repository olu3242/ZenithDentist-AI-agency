import { NextResponse, type NextRequest } from "next/server";

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export function applySecurityHeaders(response: NextResponse) {
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("content-security-policy", [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://snap.licdn.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.anthropic.com",
    "frame-ancestors 'none'"
  ].join("; "));
  return response;
}

export function rateLimit(request: NextRequest, limit = 120, windowMs = 60_000) {
  const key = `${request.nextUrl.pathname}:${request.ip ?? request.headers.get("x-forwarded-for") ?? "local"}`;
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  bucket.count += 1;
  return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
}

export function failedAuthResponse(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("admin", "unauthorized");
  return applySecurityHeaders(NextResponse.redirect(url));
}
