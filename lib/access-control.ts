import "server-only";

import { cookies } from "next/headers";
import { getDefaultPortalForRole, type ZenithRole } from "@/lib/auth-routing";
import type { Json } from "@/lib/database.types";
import { LEGAL_ENTITY } from "@/lib/legal-entity";
import { logger } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/server";

export type ClientAccountStatus =
  | "lead"
  | "proposal"
  | "contract_pending"
  | "payment_pending"
  | "approved"
  | "active"
  | "suspended"
  | "cancelled";

export interface ClientAccountRequest {
  email: string;
  fullName?: string;
  practiceName?: string;
  packageType?: string;
  metadata?: Json;
}

export interface ClientAccessDecision {
  allowed: boolean;
  reason: string;
  status?: ClientAccountStatus;
  email?: string;
  organizationId?: string | null;
  packageType?: string;
  subscriptionActive?: boolean;
  approvedForAccess?: boolean;
}

export interface ClientApprovalInput {
  clientAccountId: string;
  approvedBy?: string | null;
  organizationName?: string | null;
}

export async function requestClientAccess(input: ClientAccountRequest) {
  const supabase = createServiceClient();
  const email = normalizeEmail(input.email);
  if (!supabase) return { ok: false, message: "Supabase service client is required to request access." };
  if (!email) return { ok: false, message: "A valid email is required." };

  const payload = {
    email,
    full_name: input.fullName?.trim() || null,
    practice_name: input.practiceName?.trim() || null,
    package_type: input.packageType || "revenue_recovery_system",
    status: "lead" as ClientAccountStatus,
    approved_for_access: false,
    subscription_active: false,
    metadata: {
      requested_at: new Date().toISOString(),
      source: "signup_request",
      legal_entity: LEGAL_ENTITY.legalName,
      brand: LEGAL_ENTITY.brandName,
      ...(isObject(input.metadata) ? input.metadata : {})
    } as Json
  };

  const client = supabase as any;
  const { error } = await client
    .from("client_accounts")
    .upsert(payload, { onConflict: "email" });

  if (error) return { ok: false, message: `Unable to request access: ${error.message}` };
  return {
    ok: true,
    message: "Access request received. Zenith will approve platform access after contract execution and initial payment."
  };
}

export async function evaluateClientAccessByEmail(emailInput: string | null | undefined): Promise<ClientAccessDecision> {
  const supabase = createServiceClient();
  const email = normalizeEmail(emailInput);
  if (!supabase) return { allowed: false, reason: "service_unavailable", email };
  if (!email) return { allowed: false, reason: "email_missing" };

  const client = supabase as any;
  const { data: account, error } = await client
    .from("client_accounts")
    .select("id, organization_id, email, status, package_type, contract_signed, setup_fee_paid, implementation_started, approved_for_access, subscription_active")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    logger.warn("client_access_lookup_failed", { email, error: error.message });
    return { allowed: false, reason: "lookup_failed", email };
  }

  if (!account) {
    const authorized = await isEmailAuthorized(email);
    return {
      allowed: false,
      reason: authorized ? "client_account_missing" : "email_not_authorized",
      email
    };
  }

  const status = account.status as ClientAccountStatus;
  const approved = Boolean(account.approved_for_access);
  const activeSubscription = Boolean(account.subscription_active);
  const organizationId = account.organization_id as string | null;

  if (status === "suspended") return denied("client_suspended");
  if (status === "cancelled") return denied("client_cancelled");
  if (!approved) return denied("approval_required");
  if (!organizationId) return denied("organization_missing");
  if (!activeSubscription) return denied("subscription_inactive");

  return {
    allowed: true,
    reason: "approved",
    status,
    email,
    organizationId,
    packageType: account.package_type,
    subscriptionActive: activeSubscription,
    approvedForAccess: approved
  };

  function denied(reason: string): ClientAccessDecision {
    return {
      allowed: false,
      reason,
      status,
      email,
      organizationId,
      packageType: account.package_type,
      subscriptionActive: activeSubscription,
      approvedForAccess: approved
    };
  }
}

export async function isEmailAuthorized(emailInput: string) {
  const supabase = createServiceClient();
  const email = normalizeEmail(emailInput);
  if (!supabase || !email) return false;
  const domain = email.split("@")[1] ?? "";
  const client = supabase as any;
  const [emailMatch, domainMatch] = await Promise.all([
    client
    .from("authorized_domains")
    .select("id")
    .eq("status", "active")
      .eq("value_type", "email")
      .eq("value", email)
      .limit(1),
    client
      .from("authorized_domains")
      .select("id")
      .eq("status", "active")
      .eq("value_type", "domain")
      .eq("value", domain)
      .limit(1)
  ]);
  return Boolean(emailMatch.data?.length || domainMatch.data?.length);
}

export async function approveClientAccount(input: ClientApprovalInput) {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, message: "Supabase service client is required to approve access." };
  const client = supabase as any;

  const { data: account, error: accountError } = await client
    .from("client_accounts")
    .select("*")
    .eq("id", input.clientAccountId)
    .maybeSingle();
  if (accountError || !account) return { ok: false, message: accountError?.message ?? "Client account not found." };

  const organizationName = input.organizationName?.trim() || account.practice_name || account.full_name || account.email;
  const organization = account.organization_id
    ? { ok: true, message: "Organization exists.", organizationId: account.organization_id }
    : await createApprovedOrganization(organizationName);
  if (!organization.ok) return organization;

  const now = new Date().toISOString();
  const { error: updateError } = await client
    .from("client_accounts")
    .update({
      organization_id: organization.organizationId,
      status: "active",
      contract_signed: true,
      setup_fee_paid: true,
      implementation_started: true,
      approved_for_access: true,
      subscription_active: true,
      approved_by: input.approvedBy || null,
      approved_at: now,
      updated_at: now
    })
    .eq("id", input.clientAccountId);
  if (updateError) return { ok: false, message: `Unable to approve client: ${updateError.message}` };

  await upsertAuthorizedEmail(account.email, organization.organizationId, input.approvedBy);
  return { ok: true, message: "Client approved and organization activated.", organizationId: organization.organizationId };
}

export async function updateClientAccessStatus(clientAccountId: string, action: "suspend" | "revoke" | "activate" | "deactivate" | "resend_invitation") {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, message: "Supabase service client is required to update access." };

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };
  if (action === "suspend") Object.assign(updates, { status: "suspended", approved_for_access: false, subscription_active: false, suspended_at: now });
  if (action === "revoke") Object.assign(updates, { status: "cancelled", approved_for_access: false, subscription_active: false, revoked_at: now });
  if (action === "activate") Object.assign(updates, { status: "active", approved_for_access: true, subscription_active: true });
  if (action === "deactivate") Object.assign(updates, { subscription_active: false });
  if (action === "resend_invitation") Object.assign(updates, { invitation_sent_at: now });

  const client = supabase as any;
  const { error } = await client.from("client_accounts").update(updates).eq("id", clientAccountId);
  if (error) return { ok: false, message: `Unable to update access: ${error.message}` };
  return { ok: true, message: action === "resend_invitation" ? "Invitation marked for resend." : "Client access updated." };
}

export async function getClientApprovalState() {
  const supabase = createServiceClient();
  if (!supabase) {
    return { configured: false, accounts: [] as any[] };
  }
  const client = supabase as any;
  const { data } = await client
    .from("client_accounts")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);
  return { configured: true, accounts: data ?? [] };
}

export async function setApprovedAccessCookies(input: { role: ZenithRole; userId: string; organizationId: string }) {
  const cookieStore = await cookies();
  cookieStore.set("zenith_client_approved", "true", { path: "/", sameSite: "lax", httpOnly: true });
  cookieStore.set("zenith_subscription_active", "true", { path: "/", sameSite: "lax", httpOnly: true });
  cookieStore.set("zenith_access_checked_at", new Date().toISOString(), { path: "/", sameSite: "lax", httpOnly: true });
  cookieStore.set("zenith_redirect_to", getDefaultPortalForRole(input.role), { path: "/", sameSite: "lax", httpOnly: true });
}

export async function clearApprovedAccessCookies() {
  const cookieStore = await cookies();
  ["zenith_client_approved", "zenith_subscription_active", "zenith_access_checked_at", "zenith_redirect_to"].forEach(name => {
    cookieStore.set(name, "", { path: "/", maxAge: 0, sameSite: "lax", httpOnly: true });
  });
}

async function createApprovedOrganization(name: string) {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, message: "Supabase service client unavailable.", organizationId: "" };
  const slug = slugify(name);
  const client = supabase as any;
  const { data: existing } = await client.from("organizations").select("id").eq("slug", slug).maybeSingle();
  if (existing?.id) return { ok: true, message: "Organization exists.", organizationId: existing.id as string };

  const { data, error } = await client
    .from("organizations")
    .insert({
      name,
      slug,
      organization_type: "single_practice",
      onboarding_status: "baseline",
      settings: { access_model: "approved_client_only" } as Json,
      branding: {} as Json
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, message: `Unable to create approved organization: ${error?.message ?? "unknown"}`, organizationId: "" };
  return { ok: true, message: "Organization created.", organizationId: data.id };
}

async function upsertAuthorizedEmail(emailInput: string, organizationId: string, approvedBy?: string | null) {
  const supabase = createServiceClient();
  const email = normalizeEmail(emailInput);
  if (!supabase || !email) return;
  const client = supabase as any;
  await client.from("authorized_domains").upsert({
    organization_id: organizationId,
    value: email,
    value_type: "email",
    status: "active",
    approved_by: approvedBy || null,
    approved_at: new Date().toISOString()
  }, { onConflict: "value,value_type" });
}

function normalizeEmail(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function slugify(value: string) {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || "approved-organization";
}

function isObject(value: unknown): value is Record<string, Json> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
