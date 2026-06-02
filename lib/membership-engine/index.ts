import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export type MembershipSummary = {
  organizationId: string;
  totalActive: number;
  totalExpired: number;
  totalCancelled: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  renewalRate: number;
  churnRate: number;
  enrollmentsThisMonth: number;
};

export async function enrollMember(opts: {
  organizationId: string;
  patientExternalId: string;
  planName: string;
  monthlyValue?: number;
  annualValue?: number;
  expiresAt?: string;
}): Promise<string> {
  const supabase = createServiceClient();
  if (!supabase) return "";

  const { data, error } = await (supabase as any)
    .from("membership_tracking")
    .insert({
      organization_id: opts.organizationId,
      patient_external_id: opts.patientExternalId,
      plan_name: opts.planName,
      monthly_value: opts.monthlyValue ?? null,
      annual_value: opts.annualValue ?? null,
      expires_at: opts.expiresAt ?? null,
      status: "active",
      renewal_count: 0,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) return "";

  (async () => {
    try {
      await publishRuntimeFabricEvent({
        eventKey: "membership.enrolled",
        eventType: "agent",
        sourceSystem: "membership_engine",
        targetChannel: "mission_control",
        priority: "moderate",
        summary: `Patient enrolled in membership plan "${opts.planName}" for org ${opts.organizationId}`,
        payload: {
          organizationId: opts.organizationId,
          patientExternalId: opts.patientExternalId,
          planName: opts.planName,
          membershipId: data.id,
        },
      });
    } catch {}
  })();

  return data.id as string;
}

export async function renewMembership(
  organizationId: string,
  membershipId: string,
  newExpiresAt: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  (async () => {
    try {
      // First get current renewal_count
      const { data: current } = await (supabase as any)
        .from("membership_tracking")
        .select("renewal_count")
        .eq("organization_id", organizationId)
        .eq("id", membershipId)
        .single();

      const currentCount = Number((current as any)?.renewal_count ?? 0);

      await (supabase as any)
        .from("membership_tracking")
        .update({
          status: "active",
          expires_at: newExpiresAt,
          renewal_count: currentCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", organizationId)
        .eq("id", membershipId);
    } catch {}
  })();
}

export async function cancelMembership(
  organizationId: string,
  membershipId: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  (async () => {
    try {
      await (supabase as any)
        .from("membership_tracking")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", organizationId)
        .eq("id", membershipId);
    } catch {}
  })();

  (async () => {
    try {
      await publishRuntimeFabricEvent({
        eventKey: "membership.cancelled",
        eventType: "agent",
        sourceSystem: "membership_engine",
        targetChannel: "mission_control",
        priority: "moderate",
        summary: `Membership ${membershipId} cancelled for org ${organizationId}`,
        payload: { organizationId, membershipId },
      });
    } catch {}
  })();
}

export async function getMembershipSummary(organizationId: string): Promise<MembershipSummary> {
  const supabase = createServiceClient();

  const { data: rows } = supabase
    ? await (supabase as any)
        .from("membership_tracking")
        .select("status, monthly_value, annual_value, renewal_count, created_at")
        .eq("organization_id", organizationId)
    : { data: [] };

  const allRows: any[] = rows ?? [];

  const totalActive = allRows.filter((r: any) => r.status === "active").length;
  const totalExpired = allRows.filter((r: any) => r.status === "expired").length;
  const totalCancelled = allRows.filter((r: any) => r.status === "cancelled").length;

  const activeRows = allRows.filter((r: any) => r.status === "active");
  const monthlyRecurringRevenue = activeRows.reduce(
    (sum: number, r: any) => sum + Number(r.monthly_value ?? 0),
    0
  );
  const annualRecurringRevenue = activeRows.reduce(
    (sum: number, r: any) => sum + Number(r.annual_value ?? 0),
    0
  );

  const renewedRows = allRows.filter((r: any) => Number(r.renewal_count ?? 0) > 0);
  const renewalRate =
    allRows.length > 0 ? Math.round((renewedRows.length / allRows.length) * 100) / 100 : 0;
  const churnRate = allRows.length > 0
    ? Math.round((totalCancelled / allRows.length) * 100) / 100
    : 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const enrollmentsThisMonth = allRows.filter(
    (r: any) => r.created_at >= monthStart
  ).length;

  return {
    organizationId,
    totalActive,
    totalExpired,
    totalCancelled,
    monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue * 100) / 100,
    annualRecurringRevenue: Math.round(annualRecurringRevenue * 100) / 100,
    renewalRate,
    churnRate,
    enrollmentsThisMonth,
  };
}

export async function getActiveMemberships(organizationId: string): Promise<any[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await (supabase as any)
    .from("membership_tracking")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (data ?? []) as any[];
}
