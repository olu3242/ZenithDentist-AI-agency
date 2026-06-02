"use server";

import { redirect } from "next/navigation";
import { bootstrapUser, clearBootstrapCookies, loginBootstrapUser } from "@/lib/onboarding/bootstrap";
import { normalizeZenithRole, type ZenithRole } from "@/lib/auth-routing";
import { createServerAuthClient } from "@/lib/supabase/server";
import { isEmailAuthorized } from "@/lib/access-control";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function signupAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const requestedRole = normalizeZenithRole(String(formData.get("role") ?? "")) ?? "practice_owner";

  const result = await bootstrapUser({
    email,
    password,
    fullName,
    organizationName,
    role: requestedRole as ZenithRole
  });

  if (result.ok && result.redirectTo) redirect(result.redirectTo);
  redirect(`/signup?error=${encodeURIComponent(result.message)}`);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const result = await loginBootstrapUser(email, password);
  if (result.ok && result.redirectTo) redirect(result.redirectTo);
  redirect(`/login?error=${encodeURIComponent(result.message)}`);
}

export async function googleLoginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    redirect(`/login?error=${encodeURIComponent("Enter your invited email address before continuing with Google.")}`);
  }

  const authorized = await isEmailAuthorized(email);
  if (!authorized) {
    redirect(`/access-pending?reason=not-authorized&email=${encodeURIComponent(email)}`);
  }

  const authClient = createServerAuthClient();
  if (!authClient) {
    redirect(`/login?error=${encodeURIComponent("Supabase public auth credentials are required before Google login can run.")}`);
  }

  const { data, error } = await authClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    }
  });

  if (error || !data.url) {
    logger.warn("google_oauth_start_failed", {
      error: error?.message ?? "missing_provider_url"
    });
    redirect(`/login?error=${encodeURIComponent("Google login is not available yet. Check Supabase Google provider settings.")}`);
  }

  redirect(data.url);
}

export async function logoutAction() {
  const authClient = createServerAuthClient();
  if (authClient) await authClient.auth.signOut({ scope: "local" }).catch(() => undefined);
  await clearBootstrapCookies();
  redirect("/login?reason=signed-out");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const authClient = createServerAuthClient();
  if (authClient) {
    const { error } = await authClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
    });
    if (error) {
      logger.warn("password_reset_request_failed", { email, error: error.message });
      redirect(`/forgot-password?error=${encodeURIComponent("Unable to prepare reset instructions. Try again.")}`);
    }
  } else {
    logger.warn("password_reset_skipped_missing_auth_env", { email });
  }
  redirect(`/forgot-password?sent=${encodeURIComponent(email)}`);
}

export async function updatePasswordAction(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!code) {
    redirect(`/auth/reset-password?error=${encodeURIComponent("Reset session is missing. Request a new reset link.")}`);
  }
  if (password.length < 8) {
    redirect(`/auth/reset-password?code=${encodeURIComponent(code)}&error=${encodeURIComponent("Password must be at least 8 characters.")}`);
  }
  if (password !== confirmPassword) {
    redirect(`/auth/reset-password?code=${encodeURIComponent(code)}&error=${encodeURIComponent("Passwords do not match.")}`);
  }

  const authClient = createServerAuthClient();
  if (!authClient) {
    redirect(`/auth/reset-password?code=${encodeURIComponent(code)}&error=${encodeURIComponent("Supabase public auth credentials are required before password update can run.")}`);
  }

  const exchanged = await authClient.auth.exchangeCodeForSession(code);
  if (exchanged.error || !exchanged.data.session) {
    logger.warn("password_reset_code_exchange_failed", {
      error: exchanged.error?.message ?? "missing_session"
    });
    redirect(`/auth/reset-password?error=${encodeURIComponent("Reset link is invalid or expired. Request a new reset link.")}`);
  }

  const updated = await authClient.auth.updateUser({ password });
  if (updated.error) {
    logger.warn("password_reset_update_failed", {
      error: updated.error.message
    });
    redirect(`/auth/reset-password?code=${encodeURIComponent(code)}&error=${encodeURIComponent("Unable to update password. Request a new reset link.")}`);
  }

  redirect("/login?reason=password-updated");
}
