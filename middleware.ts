import { NextResponse, type NextRequest } from "next/server";
import { getDefaultPortalForRole, isProtectedPath, roleCanAccessPath, roleFromRequest } from "@/lib/auth-routing";
import { applySecurityHeaders, failedAuthResponse, rateLimit } from "@/lib/security-edge";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const rate = rateLimit(request);
  if (!rate.allowed) {
    return applySecurityHeaders(NextResponse.json({ error: "Too many requests." }, { status: 429 }));
  }

  if (!isProtectedPath(pathname) && !isProtectedApiPath(pathname)) {
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
    const role = roleFromRequest(request, null);
    const accessGate = requireApprovedClientAccess(request, role);
    if (accessGate) return applySecurityHeaders(accessGate);
    if (role && !pathname.startsWith("/api/") && !roleCanAccessPath(role, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = getDefaultPortalForRole(role);
      url.search = "";
      return applySecurityHeaders(NextResponse.redirect(url));
    }
    if (!request.cookies.get("zenith_user_id")?.value) return failedAuthResponse(request);
    return applySecurityHeaders(NextResponse.next());
  }

  const authenticated = tokenCandidates.find(candidate => candidate.configuredToken && candidate.token === candidate.configuredToken);
  if (authenticated) {
    const role = roleFromRequest(request, authenticated.scope);
    const accessGate = requireApprovedClientAccess(request, role);
    if (accessGate) return applySecurityHeaders(accessGate);
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

function requireApprovedClientAccess(request: NextRequest, role: ReturnType<typeof roleFromRequest>) {
  const pathname = request.nextUrl.pathname;
  if (!requiresClientApproval(pathname)) return null;
  if (role === "super_admin" || role === "agency_admin") return null;

  const userId = request.cookies.get("zenith_user_id")?.value ?? request.headers.get("x-zenith-user-id");
  const organizationId = request.cookies.get("zenith_organization_id")?.value ?? request.headers.get("x-zenith-organization-id");
  const approved = request.cookies.get("zenith_client_approved")?.value === "true";
  const subscriptionActive = request.cookies.get("zenith_subscription_active")?.value === "true";

  if (!userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("reason", "auth-required");
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (!organizationId || !approved || !subscriptionActive) {
    const url = request.nextUrl.clone();
    url.pathname = "/access-pending";
    url.searchParams.set("reason", !organizationId ? "organization_missing" : !approved ? "approval_required" : "subscription_inactive");
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return null;
}

function requiresClientApproval(pathname: string) {
  return [
    "/portal",
    "/dashboard",
    "/mission-control",
    "/workflow-os",
    "/runtime-os",
    "/automation-marketplace",
    "/automation-center",
    "/settings",
    "/onboarding",
    "/client-operations",
    "/gtm-command-center"
  ].some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isProtectedApiPath(pathname: string) {
  return [
    "/api/alice",
    "/api/autonomous",
    "/api/enterprise",
    "/api/gtm-command-center",
    "/api/mission-control",
    "/api/opendental",
    "/api/reports"
  ].some(prefix => pathname.startsWith(prefix));
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
    "/api/alice/:path*",
    "/api/autonomous/:path*",
    "/api/enterprise/:path*",
    "/api/opendental/:path*",
    "/api/reports/:path*",
    "/lead-operations/:path*",
    "/client-operations/:path*",
    "/gtm-command-center/:path*"
  ]
};
