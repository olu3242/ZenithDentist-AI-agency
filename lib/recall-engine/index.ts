import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export type RecallSummary = {
  organizationId: string;
  totalOverdue: number;
  totalContacted: number;
  totalScheduled: number;
  totalRecovered: number;
  recoveryRate: number;
  revenueRecovered: number;
  avgMonthsOverdue: number;
};

export async function addRecallPatient(opts: {
  organizationId: string;
  patientExternalId: string;
  lastVisitDate: string;
  workflowId?: string;
}): Promise<string> {
  const supabase = createServiceClient();
  if (!supabase) return "";

  const { data, error } = await (supabase as any)
    .from("recall_tracking")
    .insert({
      organization_id: opts.organizationId,
      patient_external_id: opts.patientExternalId,
      last_visit_date: opts.lastVisitDate,
      workflow_id: opts.workflowId ?? null,
      status: "overdue",
      outreach_count: 0,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) return "";

  (async () => {
    try {
      await publishRuntimeFabricEvent({
        eventKey: "recall.patient.added",
        eventType: "agent",
        sourceSystem: "recall_engine",
        targetChannel: "mission_control",
        priority: "moderate",
        summary: `Recall patient added for org ${opts.organizationId}`,
        payload: {
          organizationId: opts.organizationId,
          patientExternalId: opts.patientExternalId,
          lastVisitDate: opts.lastVisitDate,
          recallId: (data as any).id,
        },
      });
    } catch {}
  })();

  return (data as any).id as string;
}

export async function markRecallContacted(
  organizationId: string,
  recallId: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  (async () => {
    try {
      const { data: current } = await (supabase as any)
        .from("recall_tracking")
        .select("outreach_count")
        .eq("organization_id", organizationId)
        .eq("id", recallId)
        .single();

      const currentCount = Number((current as any)?.outreach_count ?? 0);

      await (supabase as any)
        .from("recall_tracking")
        .update({
          status: "contacted",
          last_outreach_at: new Date().toISOString(),
          outreach_count: currentCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", organizationId)
        .eq("id", recallId);
    } catch {}
  })();
}

export async function markRecallScheduled(
  organizationId: string,
  recallId: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  (async () => {
    try {
      await (supabase as any)
        .from("recall_tracking")
        .update({
          status: "scheduled",
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", organizationId)
        .eq("id", recallId);
    } catch {}
  })();
}

export async function markRecallRecovered(
  organizationId: string,
  recallId: string,
  revenueAttributed?: number
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  (async () => {
    try {
      await (supabase as any)
        .from("recall_tracking")
        .update({
          status: "recovered",
          recovered_at: new Date().toISOString(),
          revenue_attributed: revenueAttributed ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", organizationId)
        .eq("id", recallId);
    } catch {}
  })();

  (async () => {
    try {
      await publishRuntimeFabricEvent({
        eventKey: "recall.patient.recovered",
        eventType: "agent",
        sourceSystem: "recall_engine",
        targetChannel: "mission_control",
        priority: "moderate",
        summary: `Recall patient recovered for org ${organizationId}`,
        payload: { organizationId, recallId, revenueAttributed },
      });
    } catch {}
  })();
}

export async function getRecallSummary(organizationId: string): Promise<RecallSummary> {
  const supabase = createServiceClient();

  const { data: rows } = supabase
    ? await (supabase as any)
        .from("recall_tracking")
        .select("status, last_visit_date, revenue_attributed")
        .eq("organization_id", organizationId)
    : { data: [] };

  const allRows: any[] = rows ?? [];

  const totalOverdue = allRows.filter((r: any) => r.status === "overdue").length;
  const totalContacted = allRows.filter((r: any) => r.status === "contacted").length;
  const totalScheduled = allRows.filter((r: any) => r.status === "scheduled").length;
  const totalRecovered = allRows.filter((r: any) => r.status === "recovered").length;

  const recoveryRate =
    allRows.length > 0 ? Math.round((totalRecovered / allRows.length) * 100) / 100 : 0;

  const revenueRecovered = allRows
    .filter((r: any) => r.status === "recovered")
    .reduce((sum: number, r: any) => sum + Number(r.revenue_attributed ?? 0), 0);

  const now = new Date();
  const monthsOverdueArr = allRows
    .filter((r: any) => r.last_visit_date)
    .map((r: any) => {
      const last = new Date(r.last_visit_date as string);
      return (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24 * 30);
    });
  const avgMonthsOverdue =
    monthsOverdueArr.length > 0
      ? Math.round(
          (monthsOverdueArr.reduce((a: number, b: number) => a + b, 0) / monthsOverdueArr.length) *
            10
        ) / 10
      : 0;

  return {
    organizationId,
    totalOverdue,
    totalContacted,
    totalScheduled,
    totalRecovered,
    recoveryRate,
    revenueRecovered: Math.round(revenueRecovered * 100) / 100,
    avgMonthsOverdue,
  };
}

export async function getOverduePatients(
  organizationId: string,
  minMonthsOverdue = 0
): Promise<any[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await (supabase as any)
    .from("recall_tracking")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "overdue")
    .order("last_visit_date", { ascending: true });

  const rows: any[] = data ?? [];
  if (minMonthsOverdue <= 0) return rows;

  const now = new Date();
  return rows.filter((r: any) => {
    if (!r.last_visit_date) return false;
    const last = new Date(r.last_visit_date as string);
    const months = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return months >= minMonthsOverdue;
  });
}
