"use server";

import { redirect } from "next/navigation";
import { bootstrapUser, loginBootstrapUser } from "@/lib/onboarding/bootstrap";
import { normalizeZenithRole, type ZenithRole } from "@/lib/auth-routing";
import { createServerAuthClient } from "@/lib/supabase/server";
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
