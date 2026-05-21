import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/portal")) {
    return NextResponse.next();
  }

  const isPortal = request.nextUrl.pathname.startsWith("/portal");
  const configuredToken = isPortal ? process.env.PORTAL_ACCESS_TOKEN : process.env.ADMIN_ACCESS_TOKEN;
  if (!configuredToken) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get(isPortal ? "zenith_portal_token" : "zenith_admin_token")?.value ||
    request.headers.get(isPortal ? "x-portal-token" : "x-admin-token");
  if (token === configuredToken) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("admin", "unauthorized");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"]
};
