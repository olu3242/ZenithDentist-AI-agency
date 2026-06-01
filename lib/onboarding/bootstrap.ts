import "server-only";

import { cookies } from "next/headers";
import { createServerAuthClient, createServiceClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { getDefaultPortalForRole, type ZenithRole } from "@/lib/auth-routing";
import type { Database, Json, OrganizationRole } from "@/lib/database.types";
import { logger } from "@/lib/logger";

type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

export interface BootstrapInput {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
  role?: ZenithRole;
}

export interface BootstrapResult {
  ok: boolean;
  message: string;
  redirectTo?: string;
  role?: ZenithRole;
  userId?: string;
  organizationId?: string;
}

export interface OnboardingContext {
  userId: string;
  role: ZenithRole;
  organizationId: string;
  profile: {
    fullName: string;
    email: string;
    onboardingCompletedAt: string | null;
  } | null;
  organization: {
    name: string;
    onboardingStatus: string;
  } | null;
  membershipReady: boolean;
  redirectTo: string;
}

export async function getBootstrapState() {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      configured: false,
      hasPlatformAdmin: false,
      hasOrganizations: false
    };
  }

  const [admins, organizations] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "super_admin"),
    supabase.from("organizations").select("id", { count: "exact", head: true })
  ]);

  return {
    configured: true,
    hasPlatformAdmin: (admins.count ?? 0) > 0,
    hasOrganizations: (organizations.count ?? 0) > 0
  };
}

export async function bootstrapUser(input: BootstrapInput): Promise<BootstrapResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase service credentials are required before account bootstrap can run."
    };
  }

  const state = await getBootstrapState();
  const role: ZenithRole = state.hasPlatformAdmin ? input.role ?? "practice_owner" : "super_admin";
  const organizationName = input.organizationName.trim() || "Default Zenith Organization";
  const organizationSlug = slugify(organizationName);

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, default_organization_id")
    .eq("email", input.email)
    .maybeSingle();

  let userId = existingProfile?.id;
  if (!userId) {
    const created = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        bootstrap_role: role
      }
    });
    if (created.error || !created.data.user) {
      return {
        ok: false,
        message: created.error?.message ?? "Unable to create Supabase auth user."
      };
    }
    userId = created.data.user.id;
  }

  const organization = await ensureOrganization(organizationName, organizationSlug, !state.hasOrganizations);
  if (!organization.ok) return organization;

  const profile: ProfileInsert = {
    id: userId,
    email: input.email,
    full_name: input.fullName,
    role,
    default_organization_id: organization.organizationId,
    email_verified_at: new Date().toISOString(),
    metadata: { first_user_bootstrap: !state.hasPlatformAdmin } as Json
  };

  const { error: profileError } = await supabase.from("profiles").upsert(profile);
  if (profileError) {
    return { ok: false, message: `Unable to create profile: ${profileError.message}` };
  }

  const { data: existingMember } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organization.organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  const memberPayload = {
    organization_id: organization.organizationId,
    user_id: userId,
    role: organizationRoleForProfile(role),
    permissions: { platform_role: role } as Json,
    accepted_at: new Date().toISOString()
  };
  const { error: memberError } = existingMember?.id
    ? await supabase.from("organization_members").update(memberPayload).eq("id", existingMember.id)
    : await supabase.from("organization_members").insert(memberPayload);
  if (memberError) {
    return { ok: false, message: `Unable to create organization membership: ${memberError.message}` };
  }

  await ensureOnboardingRun({
    organizationId: organization.organizationId,
    userId,
    role,
    status: "in_progress",
    currentStep: "profile_created",
    progress: 35,
    event: "signup_bootstrap_completed"
  });

  await setBootstrapCookies({
    role,
    userId,
    organizationId: organization.organizationId
  });

  return {
    ok: true,
    message: state.hasPlatformAdmin ? "Account bootstrap complete." : "First platform admin created.",
    redirectTo: "/onboarding",
    role,
    userId,
    organizationId: organization.organizationId
  };
}

export async function loginBootstrapUser(email: string, password: string): Promise<BootstrapResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service credentials are required before login can resolve a profile." };
  }

  const authClient = createServerAuthClient();
  if (!authClient) {
    return { ok: false, message: "Supabase public auth credentials are required before password login can run." };
  }

  const auth = await authClient.auth.signInWithPassword({ email, password });
  if (auth.error || !auth.data.user) {
    logger.warn("onboarding_login_failed", {
      email,
      reason: auth.error?.message ?? "missing_user"
    });
    return { ok: false, message: "Authentication failed. Check your email and password." };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, default_organization_id, onboarding_completed_at")
    .eq("id", auth.data.user.id)
    .maybeSingle();

  if (error || !profile) {
    return { ok: false, message: "No Zenith profile exists for that email yet. Create an account first." };
  }

  await setBootstrapCookies({
    role: profile.role,
    userId: profile.id,
    organizationId: profile.default_organization_id ?? ""
  });

  return {
    ok: true,
    message: "Login scaffold resolved your Zenith profile.",
    redirectTo: profile.onboarding_completed_at ? getDefaultPortalForRole(profile.role) : "/onboarding",
    role: profile.role,
    userId: profile.id,
    organizationId: profile.default_organization_id ?? undefined
  };
}

export async function getOnboardingContext(): Promise<OnboardingContext | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("zenith_user_id")?.value;
  const role = cookieStore.get("zenith_role")?.value as ZenithRole | undefined;
  const organizationId = cookieStore.get("zenith_organization_id")?.value;
  if (!userId || !role || !organizationId) return null;

  const supabase = createServiceClient();
  if (!supabase) {
    return {
      userId,
      role,
      organizationId,
      profile: null,
      organization: null,
      membershipReady: false,
      redirectTo: getDefaultPortalForRole(role)
    };
  }

  const [profileResult, organizationResult, membershipResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, onboarding_completed_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("name, onboarding_status")
      .eq("id", organizationId)
      .maybeSingle(),
    supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle()
  ]);

  return {
    userId,
    role,
    organizationId,
    profile: profileResult.data ? {
      fullName: profileResult.data.full_name,
      email: profileResult.data.email,
      onboardingCompletedAt: profileResult.data.onboarding_completed_at
    } : null,
    organization: organizationResult.data ? {
      name: organizationResult.data.name,
      onboardingStatus: organizationResult.data.onboarding_status
    } : null,
    membershipReady: Boolean(membershipResult.data?.id),
    redirectTo: getDefaultPortalForRole(role)
  };
}

export async function completeOnboarding(): Promise<BootstrapResult> {
  const context = await getOnboardingContext();
  if (!context) {
    return { ok: false, message: "Your onboarding session is missing. Log in again to continue." };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service credentials are required to complete onboarding." };
  }

  const completedAt = new Date().toISOString();
  const [profileUpdate, organizationUpdate] = await Promise.all([
    supabase
      .from("profiles")
      .update({
        onboarding_completed_at: completedAt,
        updated_at: completedAt,
        metadata: {
          onboarding_completed: true,
          onboarding_completed_at: completedAt
        } as Json
      })
      .eq("id", context.userId),
    supabase
      .from("organizations")
      .update({
        onboarding_status: "live",
        settings: {
          onboarding_completed: true,
          onboarding_completed_at: completedAt
        } as Json
      })
      .eq("id", context.organizationId)
  ]);

  if (profileUpdate.error) {
    return { ok: false, message: `Unable to save profile onboarding state: ${profileUpdate.error.message}` };
  }
  if (organizationUpdate.error) {
    return { ok: false, message: `Unable to save organization onboarding state: ${organizationUpdate.error.message}` };
  }

  await ensureOnboardingRun({
    organizationId: context.organizationId,
    userId: context.userId,
    role: context.role,
    status: "completed",
    currentStep: "portal_handoff",
    progress: 100,
    event: "onboarding_completed"
  });

  await setBootstrapCookies({
    role: context.role,
    userId: context.userId,
    organizationId: context.organizationId
  });

  return {
    ok: true,
    message: "Onboarding completed.",
    redirectTo: context.redirectTo,
    role: context.role,
    userId: context.userId,
    organizationId: context.organizationId
  };
}

async function ensureOrganization(name: string, slug: string, defaultOrganization: boolean): Promise<BootstrapResult & { organizationId: string }> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, message: "Supabase service client unavailable.", organizationId: "" };

  const { data: existing } = await supabase.from("organizations").select("id").eq("slug", slug).maybeSingle();
  if (existing?.id) {
    return { ok: true, message: "Organization exists.", organizationId: existing.id };
  }

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      organization_type: "single_practice",
      onboarding_status: "baseline",
      settings: { default_organization: defaultOrganization } as Json,
      branding: {} as Json
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: `Unable to create organization: ${error?.message ?? "unknown"}`, organizationId: "" };
  }

  return { ok: true, message: "Organization created.", organizationId: data.id };
}

async function ensureOnboardingRun(input: {
  organizationId: string;
  userId: string;
  role: ZenithRole;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  currentStep: string;
  progress: number;
  event: string;
}) {
  const supabase = createServiceClient();
  if (!supabase) return;

  const payload = {
    organization_id: input.organizationId,
    onboarding_key: "first_user_bootstrap",
    status: input.status,
    current_step: input.currentStep,
    progress: input.progress,
    setup_payload: {
      user_id: input.userId,
      role: input.role,
      event: input.event,
      observed_at: new Date().toISOString()
    } as Json,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("tenant_onboarding_runs").insert(payload);
  if (error) {
    logger.warn("onboarding_run_write_failed", {
      organizationId: input.organizationId,
      event: input.event,
      error: error.message
    });
  } else {
    logger.info("onboarding_step_recorded", {
      organizationId: input.organizationId,
      userId: input.userId,
      status: input.status,
      currentStep: input.currentStep,
      progress: input.progress
    });
  }
}

function organizationRoleForProfile(role: ZenithRole): OrganizationRole {
  if (role === "staff") return "front_desk";
  if (role === "practice_owner") return "owner";
  return "admin";
}

async function setBootstrapCookies(input: { role: ZenithRole; userId: string; organizationId: string }) {
  const cookieStore = await cookies();
  cookieStore.set("zenith_role", input.role, { path: "/", sameSite: "lax", httpOnly: true });
  cookieStore.set("zenith_user_id", input.userId, { path: "/", sameSite: "lax", httpOnly: true });
  cookieStore.set("zenith_organization_id", input.organizationId, { path: "/", sameSite: "lax", httpOnly: true });

  const token = input.role === "super_admin"
    ? env.INTERNAL_ACCESS_TOKEN
    : input.role === "agency_admin"
      ? env.ADMIN_ACCESS_TOKEN
      : env.PORTAL_ACCESS_TOKEN;
  const cookieName = input.role === "super_admin"
    ? "zenith_internal_token"
    : input.role === "agency_admin"
      ? "zenith_admin_token"
      : "zenith_portal_token";

  if (token) cookieStore.set(cookieName, token, { path: "/", sameSite: "lax", httpOnly: true });
}

function slugify(value: string) {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || "default-organization";
}
