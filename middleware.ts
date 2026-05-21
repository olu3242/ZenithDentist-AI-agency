import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const configuredToken = process.env.ADMIN_ACCESS_TOKEN;
  if (!configuredToken) {
    return NextResponse.next();
  }

  const token = request.cookies.get("zenith_admin_token")?.value || request.headers.get("x-admin-token");
  if (token === configuredToken) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("admin", "unauthorized");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"]
};
