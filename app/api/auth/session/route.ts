import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/session
 * Returns the current session's user identity (userId, email, role).
 * Uses getUser() for authoritative identity verification.
 */
export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, error: "Auth service not configured." }, { status: 503 });
  }

  const response = NextResponse.next();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() { return req.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    userId: user.id,
    email: user.email,
    role: user.app_metadata?.role ?? null,
    createdAt: user.created_at,
  });
}
