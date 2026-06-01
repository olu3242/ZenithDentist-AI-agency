import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export interface OrganizationProvisionInput {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  ownerUserId: string;
  ownerEmail: string;
  planKey?: string;
}

export interface OrganizationProvisionResult {
  success: boolean;
  organizationId: string;
  steps: Array<{ step: string; status: "ok" | "failed" | "skipped"; detail?: string }>;
  error?: string;
}

export async function provisionOrganization(input: OrganizationProvisionInput): Promise<OrganizationProvisionResult> {
  const supabase = createServiceClient();
  const steps: OrganizationProvisionResult["steps"] = [];
  const { organizationId, organizationSlug, organizationName, ownerUserId, ownerEmail, planKey = "starter" } = input;

  if (!supabase) {
    return { success: false, organizationId, steps, error: "Supabase client unavailable" };
  }

  logger.info("org_provisioning_started", { organizationId, organizationSlug });

  // Step 1: Create default settings
  try {
    const { error } = await (supabase as any).from("organization_settings").upsert({
      organization_id: organizationId,
      branding: { primaryColor: "#1B4FCC", logoUrl: null },
      notifications: { emailEnabled: true, smsEnabled: false, webhookUrl: null },
      ai: { aliceEnabled: true, model: "claude-sonnet-4-6", maxInsightsPerMonth: 100 },
      automation: { enabled: true, maxWorkflowsPerMonth: 500 },
      created_at: new Date().toISOString(),
    }, { onConflict: "organization_id" });
    steps.push({ step: "create_settings", status: error ? "failed" : "ok", detail: error?.message });
  } catch (e) {
    steps.push({ step: "create_settings", status: "failed", detail: String(e) });
  }

  // Step 2: Create onboarding state
  try {
    const { error } = await (supabase as any).from("client_onboarding_playbooks").upsert({
      organization_id: organizationId,
      status: "not_started",
      current_stage: "kickoff_scheduled",
      stages: [],
      go_live_target: null,
      created_at: new Date().toISOString(),
    }, { onConflict: "organization_id" });
    steps.push({ step: "create_onboarding_state", status: error ? "failed" : "ok", detail: error?.message });
  } catch (e) {
    steps.push({ step: "create_onboarding_state", status: "skipped", detail: String(e) });
  }

  // Step 3: Create trial subscription
  try {
    const trialEnd = new Date(Date.now() + 14 * 86400000).toISOString();
    const { error } = await (supabase as any).from("organization_subscriptions").upsert({
      organization_id: organizationId,
      plan_key: planKey,
      status: "trialing",
      trial_ends_at: trialEnd,
      seats_allowed: 3,
      seats_used: 1,
      created_at: new Date().toISOString(),
    }, { onConflict: "organization_id" });
    steps.push({ step: "create_trial_subscription", status: error ? "failed" : "ok", detail: error?.message });
  } catch (e) {
    steps.push({ step: "create_trial_subscription", status: "failed", detail: String(e) });
  }

  // Step 4: Initialize usage metrics
  try {
    const period = new Date().toISOString().slice(0, 7);
    const { error } = await supabase.from("usage_metrics").upsert({
      organization_id: organizationId,
      metric_month: period,
      reminders_sent: 0,
      recalls_processed: 0,
      reviews_generated: 0,
      portal_users: 1,
      reports_generated: 0,
      ai_insights_consumed: 0,
    }, { onConflict: "organization_id,metric_month" });
    steps.push({ step: "init_usage_metrics", status: error ? "failed" : "ok", detail: error?.message });
  } catch (e) {
    steps.push({ step: "init_usage_metrics", status: "failed", detail: String(e) });
  }

  // Step 5: Log provisioning audit event
  try {
    const { error } = await (supabase as any).from("runtime_audit_timeline").insert({
      organization_id: organizationId,
      event_type: "organization.provisioned",
      actor_type: "system",
      title: `Organization provisioned: ${organizationName}`,
      correlation_id: organizationId,
      metadata: { slug: organizationSlug, ownerEmail, planKey },
      created_at: new Date().toISOString(),
    });
    steps.push({ step: "audit_log_provisioning", status: error ? "failed" : "ok", detail: error?.message });
  } catch (e) {
    steps.push({ step: "audit_log_provisioning", status: "skipped", detail: String(e) });
  }

  const failedSteps = steps.filter(s => s.status === "failed");
  const success = failedSteps.length === 0 || failedSteps.every(s => ["create_onboarding_state", "audit_log_provisioning"].includes(s.step));

  logger.info("org_provisioning_complete", { organizationId, success, stepsCount: steps.length, failedCount: failedSteps.length });

  return { success, organizationId, steps };
}

export async function deprovisionOrganization(organizationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) return { success: false, error: "Supabase unavailable" };

  logger.warn("org_deprovisioning_started", { organizationId });

  // Cancel subscription (soft)
  await (supabase as any).from("organization_subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("organization_id", organizationId);

  // Audit
  try {
    await (supabase as any).from("runtime_audit_timeline").insert({
      organization_id: organizationId,
      event_type: "organization.deprovisioned",
      actor_type: "system",
      title: "Organization deprovisioned",
      correlation_id: organizationId,
      metadata: {},
      created_at: new Date().toISOString(),
    });
  } catch { /* non-critical */ }

  logger.warn("org_deprovisioning_complete", { organizationId });
  return { success: true };
}
