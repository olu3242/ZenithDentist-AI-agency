/**
 * UPGRADE PATH: Supabase Auth SSR Session-Based Authentication
 *
 * The current middleware uses static env-var tokens (INTERNAL_ACCESS_TOKEN,
 * PORTAL_ACCESS_TOKEN, ADMIN_ACCESS_TOKEN) for route protection.  This is a
 * simple shared-secret guard suitable for early-stage deployments, but it does
 * not provide per-user session isolation, JWT claim inspection, or automatic
 * token refresh.
 *
 * To upgrade to full Supabase Auth SSR session-based authentication:
 *
 * 1. Install the SSR package:
 *      npm install @supabase/ssr
 *
 * 2. Replace the static-token check block with a Supabase SSR client that
 *    reads the session from the incoming request cookies:
 *
 *      import { createServerClient } from "@supabase/ssr";
 *
 *      const supabase = createServerClient(
 *        process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 *        { cookies: { getAll: () => request.cookies.getAll(),
 *                      setAll: (pairs) => pairs.forEach(({ name, value, options }) =>
 *                        response.cookies.set(name, value, options)) } }
 *      );
 *      const { data: { session } } = await supabase.auth.getSession();
 *      if (!session) return failedAuthResponse(request);
 *
 * 3. Use `session.user.id` and JWT app_metadata claims to enforce
 *    per-tenant (organizationId) route access instead of a single shared token.
 *
 * 4. Call `supabase.auth.getUser()` (not just getSession) when you need a
 *    server-side authoritative identity check, as getUser re-validates the JWT
 *    against the Supabase Auth server.
 *
 * 5. Remove the INTERNAL_ACCESS_TOKEN / PORTAL_ACCESS_TOKEN / ADMIN_ACCESS_TOKEN
 *    env vars and their cookie/header checks once all clients have migrated to
 *    Supabase session cookies.
 *
 * Reference: https://supabase.com/docs/guides/auth/server-side/nextjs
 */
import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeaders, failedAuthResponse, rateLimit } from "@/lib/security-edge";

export function middleware(request: NextRequest) {
  const rate = rateLimit(request);
  if (!rate.allowed) {
    return applySecurityHeaders(NextResponse.json({ error: "Too many requests." }, { status: 429 }));
  }

  if (
    !request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/portal") &&
    !request.nextUrl.pathname.startsWith("/internal") &&
    !request.nextUrl.pathname.startsWith("/dashboard") &&
    !request.nextUrl.pathname.startsWith("/mission-control") &&
    !request.nextUrl.pathname.startsWith("/api/mission-control") &&
    !request.nextUrl.pathname.startsWith("/api/gtm-command-center") &&
    !request.nextUrl.pathname.startsWith("/lead-operations") &&
    !request.nextUrl.pathname.startsWith("/client-operations") &&
    !request.nextUrl.pathname.startsWith("/gtm-command-center")
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  const isPortal = request.nextUrl.pathname.startsWith("/portal");
  const isInternal =
    request.nextUrl.pathname.startsWith("/internal") ||
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/mission-control") ||
    request.nextUrl.pathname.startsWith("/api/mission-control") ||
    request.nextUrl.pathname.startsWith("/api/gtm-command-center") ||
    request.nextUrl.pathname.startsWith("/lead-operations") ||
    request.nextUrl.pathname.startsWith("/client-operations") ||
    request.nextUrl.pathname.startsWith("/gtm-command-center");
  const configuredToken = isInternal
    ? process.env.INTERNAL_ACCESS_TOKEN
    : isPortal
      ? process.env.PORTAL_ACCESS_TOKEN
      : process.env.ADMIN_ACCESS_TOKEN;
  if (!configuredToken) {
    return applySecurityHeaders(NextResponse.next());
  }

  const token =
    request.cookies.get(isInternal ? "zenith_internal_token" : isPortal ? "zenith_portal_token" : "zenith_admin_token")?.value ||
    request.headers.get(isInternal ? "x-internal-token" : isPortal ? "x-portal-token" : "x-admin-token");
  if (token === configuredToken) {
    return applySecurityHeaders(NextResponse.next());
  }

  return failedAuthResponse(request);
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*", "/internal/:path*", "/dashboard/:path*", "/mission-control/:path*", "/api/mission-control/:path*", "/api/gtm-command-center/:path*", "/lead-operations/:path*", "/client-operations/:path*", "/gtm-command-center/:path*"]
};
