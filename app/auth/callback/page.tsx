import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { createServerAuthClient } from "@/lib/supabase/server";
import { resolveAuthenticatedBootstrapUser } from "@/lib/onboarding/bootstrap";
import { logger } from "@/lib/logger";

export default async function AuthCallbackPage({
  searchParams
}: {
  searchParams?: Promise<{ code?: string; error?: string; error_description?: string }>;
}) {
  const params = await searchParams;
  if (params?.error) {
    redirect(`/login?error=${encodeURIComponent(params.error_description ?? params.error)}`);
  }

  if (params?.code) {
    const authClient = createServerAuthClient();
    if (!authClient) {
      redirect(`/login?error=${encodeURIComponent("Supabase public auth credentials are required before auth callback can run.")}`);
    }

    const exchanged = await authClient.auth.exchangeCodeForSession(params.code);
    if (exchanged.error || !exchanged.data.user) {
      logger.warn("auth_callback_exchange_failed", {
        error: exchanged.error?.message ?? "missing_user"
      });
      redirect(`/login?error=${encodeURIComponent("Authentication callback failed. Try signing in again.")}`);
    }

    const resolved = await resolveAuthenticatedBootstrapUser(exchanged.data.user.id);
    if (resolved.ok && resolved.redirectTo) redirect(resolved.redirectTo);
    redirect(`/login?error=${encodeURIComponent(resolved.message)}`);
  }

  return (
    <AuthCard title="Auth callback ready" subtitle="No auth code was provided. Start again from login to create a session.">
      <a href="/login" className="inline-flex min-h-10 items-center rounded bg-teal px-4 text-sm font-black text-white">Back to Login</a>
    </AuthCard>
  );
}
