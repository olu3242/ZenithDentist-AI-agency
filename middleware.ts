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
