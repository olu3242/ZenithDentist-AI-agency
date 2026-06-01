import "server-only";

import { cookies } from "next/headers";
import { createServerAuthClient, createServiceClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { getSupabaseRestUrl } from "@/lib/external-diagnostics";
import { getDefaultPortalForRole, type ZenithRole } from "@/lib/auth-routing";
import type { Database, Json, OrganizationRole } from "@/lib/database.types";
import { logger } from "@/lib/logger";

type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

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

interface AuthRecoveryAudit {
  authUserExists: boolean;
  profileExists: boolean;
  organizationExists: boolean;
  membershipExists: boolean;
  onboardingCompleted: boolean;
  selfHealed: string[];
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
      message: "A Supabase service_role key is required before account bootstrap can run."
    };
  }

  const state = await getBootstrapState();
  const role: ZenithRole = state.hasPlatformAdmin ? input.role ?? "practice_owner" : "super_admin";
  const organizationName = input.organizationName.trim() || "Default Zenith Organization";
  const organizationSlug = slugify(organizationName);

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, default_organization_id, onboarding_completed_at")
    .eq("email", input.email)
    .maybeSingle();

  const existingAuthUser = await findAuthUserByEmail(input.email);
  let userId = existingProfile?.id ?? existingAuthUser?.id;

  if (userId) {
    const signIn = await signInExistingEmail(input.email, input.password);
    userId = signIn.userId ?? userId;
    const recovered = await recoverAuthAccount({
      userId,
      email: input.email,
      fullName: input.fullName,
      role,
      organizationName,
      organizationSlug,
      allowSession: Boolean(signIn.ok)
    });
    if (!recovered.ok) return recovered;

    logger.info("auth_existing_email_recovered", {
      email: input.email,
      userId,
      signedIn: signIn.ok,
      audit: recovered.audit
    });

    if (!signIn.ok) {
      return {
        ok: true,
        message: "This email is already registered. Log in or reset your password to continue.",
        redirectTo: `/login?reason=existing-email&email=${encodeURIComponent(input.email)}`
      };
    }

    return {
      ok: true,
      message: recovered.audit.onboardingCompleted ? "Existing account resolved." : "Existing account recovered. Resume onboarding.",
      redirectTo: recovered.redirectTo,
      role: recovered.role,
      userId: recovered.userId,
      organizationId: recovered.organizationId
    };
  }

  if (!userId) {
    logger.info("platform_admin_create_user_request", {
      provider: "supabase",
      function: "bootstrapUser",
      url: `${getSupabaseRestUrl().replace("/rest/v1/", "")}/auth/v1/admin/users`,
      method: "POST",
      headers: {
        apikeyLoaded: true,
        authorizationLoaded: true
      },
      payload: {
        email: input.email,
        passwordLength: input.password.length,
        email_confirm: true,
        role
      }
    });
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
      if (isDuplicateEmailError(created.error?.message)) {
        const duplicateAuthUser = await findAuthUserByEmail(input.email);
        if (duplicateAuthUser?.id) {
          const recovered = await recoverAuthAccount({
            userId: duplicateAuthUser.id,
            email: input.email,
            fullName: input.fullName,
            role,
            organizationName,
            organizationSlug,
            allowSession: false
          });
          if (!recovered.ok) return recovered;
          logger.info("auth_duplicate_email_self_healed", {
            email: input.email,
            userId: duplicateAuthUser.id,
            audit: recovered.audit
          });
          return {
            ok: true,
            message: "This email is already registered. Log in or reset your password to continue.",
            redirectTo: `/login?reason=existing-email&email=${encodeURIComponent(input.email)}`
          };
        }
      }
      logger.warn("platform_admin_create_user_failed", {
        provider: "supabase",
        function: "bootstrapUser",
        url: `${getSupabaseRestUrl().replace("/rest/v1/", "")}/auth/v1/admin/users`,
        method: "POST",
        status: created.error?.status,
        responseBody: created.error?.message ?? "missing_user",
        requestPayload: {
          email: input.email,
          passwordLength: input.password.length,
          email_confirm: true,
          role
        }
      });
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
    return { ok: false, message: "A Supabase service_role key is required before login can resolve a profile." };
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

  return resolveAuthenticatedBootstrapUser(auth.data.user.id);
}

export async function resolveAuthenticatedBootstrapUser(userId: string): Promise<BootstrapResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { ok: false, message: "A Supabase service_role key is required before login can resolve a profile." };
  }

  const authUser = await supabase.auth.admin.getUserById(userId);
  const email = authUser.data.user?.email?.toLowerCase();
  const fullName = getAuthFullName(authUser.data.user?.user_metadata);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, default_organization_id, onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, message: `Unable to resolve profile: ${error.message}` };
  }
  if (!email && !profile?.email) {
    return { ok: false, message: "Unable to resolve the account email. Contact support or try signing in again." };
  }

  const role = profile?.role ?? "practice_owner";
  const organizationName = profile?.default_organization_id
    ? "Recovered Zenith Organization"
    : "Recovered Zenith Organization";
  const recovered = await recoverAuthAccount({
    userId,
    email: profile?.email ?? email!,
    fullName: profile?.full_name ?? fullName ?? "Zenith User",
    role,
    organizationName,
    organizationSlug: `recovered-${userId.slice(0, 8)}`,
    allowSession: true,
    existingProfile: profile
  });

  if (!recovered.ok) return recovered;

  logger.info("auth_login_recovery_audit", {
    userId,
    audit: recovered.audit
  });

  return {
    ok: true,
    message: "Login scaffold resolved your Zenith profile.",
    redirectTo: recovered.redirectTo,
    role: recovered.role,
    userId: recovered.userId,
    organizationId: recovered.organizationId
  };
}

async function recoverAuthAccount(input: {
  userId: string;
  email: string;
  fullName: string;
  role: ZenithRole;
  organizationName: string;
  organizationSlug: string;
  allowSession: boolean;
  existingProfile?: Pick<ProfileRow, "id" | "email" | "full_name" | "role" | "default_organization_id" | "onboarding_completed_at"> | null;
}): Promise<BootstrapResult & { audit: AuthRecoveryAudit }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase service client unavailable.",
      audit: emptyRecoveryAudit(false)
    };
  }

  const selfHealed: string[] = [];
  const profile = input.existingProfile ?? (await supabase
    .from("profiles")
    .select("id, email, full_name, role, default_organization_id, onboarding_completed_at")
    .eq("id", input.userId)
    .maybeSingle()).data;

  let organizationId = profile?.default_organization_id ?? null;
  let organizationExists = false;
  if (organizationId) {
    const { data: existingOrg } = await supabase.from("organizations").select("id").eq("id", organizationId).maybeSingle();
    organizationExists = Boolean(existingOrg?.id);
  }

  if (!organizationExists) {
    const organization = await ensureOrganization(input.organizationName, input.organizationSlug, false);
    if (!organization.ok) {
      return {
        ...organization,
        audit: {
          authUserExists: true,
          profileExists: Boolean(profile),
          organizationExists: false,
          membershipExists: false,
          onboardingCompleted: Boolean(profile?.onboarding_completed_at),
          selfHealed
        }
      };
    }
    organizationId = organization.organizationId;
    organizationExists = true;
    selfHealed.push("organization");
  }

  const recoveredRole: ZenithRole = profile?.role ?? input.role;
  const profilePayload: ProfileInsert = {
    id: input.userId,
    email: input.email,
    full_name: input.fullName || profile?.full_name || "Zenith User",
    role: recoveredRole,
    default_organization_id: organizationId,
    email_verified_at: new Date().toISOString(),
    metadata: {
      recovered_from_existing_auth_user: true,
      recovered_at: new Date().toISOString()
    } as Json
  };

  const { error: profileError } = await supabase.from("profiles").upsert(profilePayload);
  if (profileError) {
    return {
      ok: false,
      message: `Unable to self-heal profile: ${profileError.message}`,
      audit: {
        authUserExists: true,
        profileExists: Boolean(profile),
        organizationExists,
        membershipExists: false,
        onboardingCompleted: Boolean(profile?.onboarding_completed_at),
        selfHealed
      }
    };
  }
  if (!profile) selfHealed.push("profile");
  if (profile && !profile.default_organization_id) selfHealed.push("profile.default_organization_id");

  const { data: existingMember } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId!)
    .eq("user_id", input.userId)
    .maybeSingle();

  const memberPayload = {
    organization_id: organizationId!,
    user_id: input.userId,
    role: organizationRoleForProfile(recoveredRole),
    permissions: { platform_role: recoveredRole, recovered: true } as Json,
    accepted_at: new Date().toISOString()
  };

  const { error: memberError } = existingMember?.id
    ? await supabase.from("organization_members").update(memberPayload).eq("id", existingMember.id)
    : await supabase.from("organization_members").insert(memberPayload);
  if (memberError) {
    return {
      ok: false,
      message: `Unable to self-heal organization membership: ${memberError.message}`,
      audit: {
        authUserExists: true,
        profileExists: true,
        organizationExists,
        membershipExists: Boolean(existingMember?.id),
        onboardingCompleted: Boolean(profile?.onboarding_completed_at),
        selfHealed
      }
    };
  }
  if (!existingMember?.id) selfHealed.push("organization_members");

  const onboardingCompleted = Boolean(profile?.onboarding_completed_at);
  if (!onboardingCompleted) {
    await ensureOnboardingRun({
      organizationId: organizationId!,
      userId: input.userId,
      role: recoveredRole,
      status: "in_progress",
      currentStep: "auth_recovery",
      progress: 40,
      event: "auth_recovery_completed"
    });
    selfHealed.push("tenant_onboarding_runs");
  }

  if (input.allowSession) {
    await setBootstrapCookies({
      role: recoveredRole,
      userId: input.userId,
      organizationId: organizationId!
    });
  }

  const redirectTo = onboardingCompleted ? getDefaultPortalForRole(recoveredRole) : "/onboarding";

  return {
    ok: true,
    message: onboardingCompleted ? "Existing account recovered." : "Existing account recovered. Resume onboarding.",
    redirectTo,
    role: recoveredRole,
    userId: input.userId,
    organizationId: organizationId!,
    audit: {
      authUserExists: true,
      profileExists: true,
      organizationExists,
      membershipExists: true,
      onboardingCompleted,
      selfHealed
    }
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
    return { ok: false, message: "A Supabase service_role key is required to complete onboarding." };
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
    const schemaCacheRecovery = error?.message?.includes("schema cache") || error?.code === "PGRST205";
    const recoveryHint = schemaCacheRecovery
      ? " Apply migration 20260616000000_core_tenancy_repair.sql, then refresh the Supabase schema cache."
      : "";
    return { ok: false, message: `Unable to create organization: ${error?.message ?? "unknown"}.${recoveryHint}`, organizationId: "" };
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

export async function setBootstrapCookies(input: { role: ZenithRole; userId: string; organizationId: string }) {
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

export async function clearBootstrapCookies() {
  const cookieStore = await cookies();
  [
    "zenith_role",
    "zenith_user_id",
    "zenith_organization_id",
    "zenith_internal_token",
    "zenith_admin_token",
    "zenith_portal_token"
  ].forEach(name => {
    cookieStore.set(name, "", { path: "/", maxAge: 0, sameSite: "lax", httpOnly: true });
  });
}

async function signInExistingEmail(email: string, password: string) {
  const authClient = createServerAuthClient();
  if (!authClient || !password) return { ok: false, userId: undefined };

  const result = await authClient.auth.signInWithPassword({ email, password });
  if (result.error || !result.data.user) {
    return { ok: false, userId: undefined };
  }

  return { ok: true, userId: result.data.user.id };
}

async function findAuthUserByEmail(email: string) {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 100;

  while (page <= 10) {
    const result = await supabase.auth.admin.listUsers({ page, perPage });
    if (result.error) {
      logger.warn("auth_user_lookup_failed", {
        email: normalized,
        page,
        error: result.error.message
      });
      return null;
    }

    const match = result.data.users.find(user => user.email?.toLowerCase() === normalized);
    if (match) return match;
    if (result.data.users.length < perPage) return null;
    page += 1;
  }

  logger.warn("auth_user_lookup_page_limit_reached", { email: normalized });
  return null;
}

function isDuplicateEmailError(message: string | undefined) {
  return Boolean(message?.toLowerCase().includes("already") && message.toLowerCase().includes("registered"));
}

function getAuthFullName(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as Record<string, unknown>).full_name ?? (metadata as Record<string, unknown>).name;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function emptyRecoveryAudit(authUserExists: boolean): AuthRecoveryAudit {
  return {
    authUserExists,
    profileExists: false,
    organizationExists: false,
    membershipExists: false,
    onboardingCompleted: false,
    selfHealed: []
  };
}

function slugify(value: string) {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || "default-organization";
}
