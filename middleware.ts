import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { applySecurityHeaders, failedAuthResponse, rateLimit } from "@/lib/security-edge";

/**
 * Authentication strategy: dual-mode
 *
 * PRIMARY — Supabase Auth SSR session (when NEXT_PUBLIC_SUPABASE_URL and
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY are set). The Supabase Auth JWT is read
 *   from the session cookie, validated via getUser() against the Auth server,
 *   and the verified identity is forwarded as x-user-id / x-user-email /
 *   x-user-role request headers for downstream use.
 *
 * FALLBACK — Static pre-shared tokens (INTERNAL_ACCESS_TOKEN,
 *   PORTAL_ACCESS_TOKEN, ADMIN_ACCESS_TOKEN). Active when:
 *   a) Supabase env vars are not configured, OR
 *   b) Supabase session is not present (allows coexistence during migration).
 *   Fail-closed: if the env var is absent, the request is blocked (not passed through).
 *
 * Upgrade checklist (remove static tokens when complete):
 *   ✓ @supabase/ssr installed
 *   ✓ Supabase Auth configured with email/password provider
 *   ✓ Login page at /login (or /portal/login, /dashboard/login)
 *   ✓ Auth API routes: POST /api/auth/login, POST /api/auth/logout
 *   □ Remove INTERNAL_ACCESS_TOKEN / PORTAL_ACCESS_TOKEN / ADMIN_ACCESS_TOKEN
 *   □ Remove static-token fallback block below
 */

const PROTECTED_PATHS = [
  "/admin",
  "/portal",
  "/internal",
  "/dashboard",
  "/mission-control",
  "/api/mission-control",
  "/api/gtm-command-center",
  "/api/alice",
  "/api/dental",
  "/api/enterprise",
  "/api/autonomous",
  "/api/analytics",
  "/api/marketplace",
  "/api/reports",
  "/lead-operations",
  "/client-operations",
  "/gtm-command-center",
] as const;

const INTERNAL_PATHS = [
  "/internal",
  "/dashboard",
  "/mission-control",
  "/api/mission-control",
  "/api/gtm-command-center",
  "/api/alice",
  "/api/dental",
  "/api/enterprise",
  "/api/autonomous",
  "/api/analytics",
  "/api/marketplace",
  "/api/reports",
  "/lead-operations",
  "/client-operations",
  "/gtm-command-center",
] as const;

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some(p => pathname.startsWith(p));
}

function isPortalPath(pathname: string): boolean {
  return pathname.startsWith("/portal");
}

function isInternalPath(pathname: string): boolean {
  return (INTERNAL_PATHS as readonly string[]).some(p => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const rate = rateLimit(request);
  if (!rate.allowed) {
    return applySecurityHeaders(
      NextResponse.json({ error: "Too many requests." }, { status: 429 })
    );
  }

  if (!isProtected(request.nextUrl.pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  // ── PRIMARY: Supabase Auth SSR session validation ─────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const requestHeaders = new Headers(request.headers);
    const response = NextResponse.next({ request: { headers: requestHeaders } });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            requestHeaders.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // getUser() re-validates JWT against the Auth server (authoritative check).
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!error && user) {
      // Inject verified identity headers for downstream route handlers
      requestHeaders.set("x-user-id", user.id);
      requestHeaders.set("x-user-email", user.email ?? "");
      // Role from app_metadata (set by server-side admin when granting membership)
      const role = (user.app_metadata?.role as string | undefined) ?? "";
      if (role) requestHeaders.set("x-user-role", role);

      return applySecurityHeaders(
        NextResponse.next({ request: { headers: requestHeaders } })
      );
    }
    // Session absent — fall through to static-token check
  }

  // ── FALLBACK: Static pre-shared token validation ───────────────────────────
  const pathname = request.nextUrl.pathname;
  const isPortal = isPortalPath(pathname);
  const isInternal = isInternalPath(pathname);
  const configuredToken = isInternal
    ? process.env.INTERNAL_ACCESS_TOKEN
    : isPortal
    ? process.env.PORTAL_ACCESS_TOKEN
    : process.env.ADMIN_ACCESS_TOKEN;

  // Fail-closed: unset env var → block, not pass-through
  if (!configuredToken) {
    return failedAuthResponse(request);
  }

  const cookieName = isInternal
    ? "zenith_internal_token"
    : isPortal
    ? "zenith_portal_token"
    : "zenith_admin_token";
  const headerName = isInternal
    ? "x-internal-token"
    : isPortal
    ? "x-portal-token"
    : "x-admin-token";

  const token =
    request.cookies.get(cookieName)?.value ||
    request.headers.get(headerName);

  if (token === configuredToken) {
    return applySecurityHeaders(NextResponse.next());
  }

  return failedAuthResponse(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/portal/:path*",
    "/internal/:path*",
    "/dashboard/:path*",
    "/mission-control/:path*",
    "/api/mission-control/:path*",
    "/api/gtm-command-center/:path*",
    "/api/alice/:path*",
    "/api/dental/:path*",
    "/api/enterprise/:path*",
    "/api/autonomous/:path*",
    "/api/analytics/:path*",
    "/api/marketplace/:path*",
    "/api/reports/:path*",
    "/api/billing/:path*",
    "/api/monitoring/:path*",
    "/api/audit/:path*",
    "/api/support/:path*",
    "/api/roi/:path*",
    "/api/command-center/:path*",
    "/api/commercialization/:path*",
    "/lead-operations/:path*",
    "/client-operations/:path*",
    "/gtm-command-center/:path*",
  ],
};
