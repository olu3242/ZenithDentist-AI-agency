import { NextResponse, type NextRequest } from "next/server";
import { getDefaultPortalForRole, isProtectedPath, roleCanAccessPath, roleFromRequest } from "@/lib/auth-routing";
import { applySecurityHeaders, failedAuthResponse, rateLimit } from "@/lib/security-edge";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const rate = rateLimit(request);
  if (!rate.allowed) {
    return applySecurityHeaders(NextResponse.json({ error: "Too many requests." }, { status: 429 }));
  }

  if (!isProtectedPath(pathname) && !pathname.startsWith("/api/mission-control") && !pathname.startsWith("/api/gtm-command-center")) {
    return applySecurityHeaders(NextResponse.next());
  }

  const tokenCandidates = [
    {
      scope: "internal" as const,
      configuredToken: process.env.INTERNAL_ACCESS_TOKEN,
      token: request.cookies.get("zenith_internal_token")?.value ?? request.headers.get("x-internal-token")
    },
    {
      scope: "portal" as const,
      configuredToken: process.env.PORTAL_ACCESS_TOKEN,
      token: request.cookies.get("zenith_portal_token")?.value ?? request.headers.get("x-portal-token")
    },
    {
      scope: "admin" as const,
      configuredToken: process.env.ADMIN_ACCESS_TOKEN,
      token: request.cookies.get("zenith_admin_token")?.value ?? request.headers.get("x-admin-token")
    }
  ];
  const hasConfiguredProtection = tokenCandidates.some(candidate => candidate.configuredToken);
  if (!hasConfiguredProtection) {
    return applySecurityHeaders(NextResponse.next());
  }

  const authenticated = tokenCandidates.find(candidate => candidate.configuredToken && candidate.token === candidate.configuredToken);
  if (authenticated) {
    const role = roleFromRequest(request, authenticated.scope);
    if (role && !pathname.startsWith("/api/") && !roleCanAccessPath(role, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = getDefaultPortalForRole(role);
      url.search = "";
      logAuthDecision(request, {
        userId: request.cookies.get("zenith_user_id")?.value ?? request.headers.get("x-zenith-user-id"),
        profileRole: request.cookies.get("zenith_role")?.value ?? request.headers.get("x-zenith-role") ?? role,
        organizationId: request.cookies.get("zenith_organization_id")?.value ?? request.headers.get("x-zenith-organization-id"),
        redirectTarget: url.pathname
      });
      return applySecurityHeaders(NextResponse.redirect(url));
    }
    logAuthDecision(request, {
      userId: request.cookies.get("zenith_user_id")?.value ?? request.headers.get("x-zenith-user-id"),
      profileRole: request.cookies.get("zenith_role")?.value ?? request.headers.get("x-zenith-role") ?? role,
      organizationId: request.cookies.get("zenith_organization_id")?.value ?? request.headers.get("x-zenith-organization-id"),
      redirectTarget: null
    });
    return applySecurityHeaders(NextResponse.next());
  }

  logAuthDecision(request, {
    userId: request.cookies.get("zenith_user_id")?.value ?? request.headers.get("x-zenith-user-id"),
    profileRole: request.cookies.get("zenith_role")?.value ?? request.headers.get("x-zenith-role"),
    organizationId: request.cookies.get("zenith_organization_id")?.value ?? request.headers.get("x-zenith-organization-id"),
    redirectTarget: "/login"
  });
  return failedAuthResponse(request);
}

function logAuthDecision(
  request: NextRequest,
  details: { userId: string | null; profileRole: string | null; organizationId: string | null; redirectTarget: string | null }
) {
  console.info("[zenith-auth-debug]", {
    pathname: request.nextUrl.pathname,
    userId: details.userId ?? "unknown",
    profileRole: details.profileRole ?? "unknown",
    organizationId: details.organizationId ?? "unknown",
    redirectTarget: details.redirectTarget ?? "none"
  });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/portal/:path*",
    "/internal/:path*",
    "/dashboard/:path*",
    "/mission-control/:path*",
    "/workflow-os/:path*",
    "/runtime-os/:path*",
    "/automation-marketplace/:path*",
    "/automation-center/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/api/mission-control/:path*",
    "/api/gtm-command-center/:path*",
    "/lead-operations/:path*",
    "/client-operations/:path*",
    "/gtm-command-center/:path*"
  ]
};
