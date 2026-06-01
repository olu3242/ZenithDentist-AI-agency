import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * SSR Supabase client — reads the authenticated user's session from cookies.
 * Use this in Server Components and Route Handlers (not middleware).
 * Returns null when Supabase env vars are not configured.
 */
export async function createSessionClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll throws in Server Components — safe to ignore; session refresh
          // happens in middleware which has mutable cookie access.
        }
      },
    },
  });
}

/**
 * Get the currently authenticated Supabase user.
 * Uses getUser() (re-validates JWT against Auth server) rather than
 * getSession() (trusts the local cookie) for authoritative identity.
 * Returns null when no session exists or env is not configured.
 */
export async function getAuthenticatedUser() {
  const client = await createSessionClient();
  if (!client) return null;
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  return user;
}
