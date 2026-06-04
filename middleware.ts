import { NextResponse, type NextRequest } from "next/server";
import { getDefaultPortalForRole, isProtectedPath, roleCanAccessPath, roleFromRequest } from "@/lib/auth-routing";
import { applySecurityHeaders, failedAuthResponse, rateLimit } from "@/lib/security-edge";
import { defaultLocale, isSupportedLocale } from "@/lib/i18n/config";

export function middleware(request: NextRequest) {
  const localeRoute = getLocaleRoute(request);
  const pathname = localeRoute.pathname;
  const rate = rateLimit(request);
  if (!rate.allowed) {
    return withLocaleResponse(applySecurityHeaders(NextResponse.json({ error: "Too many requests." }, { status: 429 })), localeRoute.locale);
  }

  if (!isProtectedPath(pathname) && !isProtectedApiPath(pathname)) {
    return withLocaleResponse(applySecurityHeaders(nextLocalized(request, localeRoute)), localeRoute.locale);
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
    if (accessGate) return withLocaleResponse(applySecurityHeaders(accessGate), localeRoute.locale);
    if (role && !pathname.startsWith("/api/") && !roleCanAccessPath(role, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = getDefaultPortalForRole(role);
      url.search = "";
      return withLocaleResponse(applySecurityHeaders(NextResponse.redirect(url)), localeRoute.locale);
    }
    if (!request.cookies.get("zenith_user_id")?.value) return withLocaleResponse(failedAuthResponse(request), localeRoute.locale);
    return withLocaleResponse(applySecurityHeaders(nextLocalized(request, localeRoute)), localeRoute.locale);
  }

  const authenticated = tokenCandidates.find(candidate => candidate.configuredToken && candidate.token === candidate.configuredToken);
  if (authenticated) {
    const role = roleFromRequest(request, authenticated.scope);
    const accessGate = requireApprovedClientAccess(request, role);
    if (accessGate) return withLocaleResponse(applySecurityHeaders(accessGate), localeRoute.locale);
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
      return withLocaleResponse(applySecurityHeaders(NextResponse.redirect(url)), localeRoute.locale);
    }
    logAuthDecision(request, {
      userId: request.cookies.get("zenith_user_id")?.value ?? request.headers.get("x-zenith-user-id"),
      profileRole: request.cookies.get("zenith_role")?.value ?? request.headers.get("x-zenith-role") ?? role,
      organizationId: request.cookies.get("zenith_organization_id")?.value ?? request.headers.get("x-zenith-organization-id"),
      redirectTarget: null
    });
    return withLocaleResponse(applySecurityHeaders(nextLocalized(request, localeRoute)), localeRoute.locale);
  }

  logAuthDecision(request, {
    userId: request.cookies.get("zenith_user_id")?.value ?? request.headers.get("x-zenith-user-id"),
    profileRole: request.cookies.get("zenith_role")?.value ?? request.headers.get("x-zenith-role"),
    organizationId: request.cookies.get("zenith_organization_id")?.value ?? request.headers.get("x-zenith-organization-id"),
    redirectTarget: "/login"
  });
  return withLocaleResponse(failedAuthResponse(request), localeRoute.locale);
}

function getLocaleRoute(request: NextRequest) {
  const url = request.nextUrl;
  const [, firstSegment, ...rest] = url.pathname.split("/");
  const locale = isSupportedLocale(firstSegment)
    ? firstSegment
    : isSupportedLocale(request.cookies.get("zenith_locale")?.value)
      ? request.cookies.get("zenith_locale")!.value
      : defaultLocale;
  const pathname = isSupportedLocale(firstSegment) ? `/${rest.join("/")}` || "/" : url.pathname;
  return {
    locale,
    pathname,
    isPrefixed: isSupportedLocale(firstSegment)
  };
}

function requestHeadersWithLocale(request: NextRequest, locale: string) {
  const headers = new Headers(request.headers);
  headers.set("x-zenith-locale", locale);
  return headers;
}

function nextLocalized(request: NextRequest, route: ReturnType<typeof getLocaleRoute>) {
  const headers = requestHeadersWithLocale(request, route.locale);
  if (route.isPrefixed) {
    const url = request.nextUrl.clone();
    url.pathname = route.pathname;
    return NextResponse.rewrite(url, { request: { headers } });
  }
  return NextResponse.next({ request: { headers } });
}

function withLocaleResponse(response: NextResponse, locale: string) {
  response.cookies.set("zenith_locale", locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });
  response.headers.set("x-zenith-locale", locale);
  return response;
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
    "/api/reports",
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
    "/en-US",
    "/en-US/:path*",
    "/es-US",
    "/es-US/:path*",
    "/en-CA",
    "/en-CA/:path*",
    "/fr-CA",
    "/fr-CA/:path*",
    "/lead-operations/:path*",
    "/client-operations/:path*",
    "/gtm-command-center/:path*"
  ]
};
