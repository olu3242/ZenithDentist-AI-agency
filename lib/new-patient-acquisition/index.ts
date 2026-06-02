import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export async function recordLead(opts: {
  organizationId: string;
  leadSource: string;
  contactEmail?: string;
  contactPhone?: string;
  treatmentInterest?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const supabase = createServiceClient();
  if (!supabase) return "";

  const { data, error } = await (supabase as any)
    .from("new_patient_leads")
    .insert({
      organization_id: opts.organizationId,
      lead_source: opts.leadSource,
      contact_email: opts.contactEmail ?? null,
      contact_phone: opts.contactPhone ?? null,
      treatment_interest: opts.treatmentInterest ?? null,
      metadata: opts.metadata ?? null,
      status: "new",
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) return "";
  return (data as any).id as string;
}

export async function updateLeadStatus(
  organizationId: string,
  leadId: string,
  status: "contacted" | "scheduled" | "converted" | "lost",
  patientExternalId?: string,
  revenueAttributed?: number
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "converted") {
    updatePayload.converted_at = new Date().toISOString();
    if (patientExternalId) updatePayload.patient_external_id = patientExternalId;
    if (revenueAttributed != null) updatePayload.revenue_attributed = revenueAttributed;
  }

  (async () => {
    try {
      await (supabase as any)
        .from("new_patient_leads")
        .update(updatePayload)
        .eq("organization_id", organizationId)
        .eq("id", leadId);
    } catch {}
  })();

  if (status === "converted") {
    (async () => {
      try {
        await publishRuntimeFabricEvent({
          eventKey: "lead.converted",
          eventType: "agent",
          sourceSystem: "new_patient_acquisition",
          targetChannel: "mission_control",
          priority: "moderate",
          summary: `New patient lead converted for org ${organizationId}`,
          payload: {
            organizationId,
            leadId,
            patientExternalId,
            revenueAttributed,
          },
        });
      } catch {}
    })();
  }
}

export async function getAcquisitionSummary(organizationId: string): Promise<{
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  revenueAttributed: number;
  bySource: Record<string, number>;
}> {
  const supabase = createServiceClient();

  const { data: rows } = supabase
    ? await (supabase as any)
        .from("new_patient_leads")
        .select("status, lead_source, revenue_attributed")
        .eq("organization_id", organizationId)
    : { data: [] };

  const allRows: any[] = rows ?? [];

  const totalLeads = allRows.length;
  const convertedLeads = allRows.filter((r: any) => r.status === "converted").length;
  const conversionRate =
    totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) / 100 : 0;

  const revenueAttributed = allRows
    .filter((r: any) => r.status === "converted")
    .reduce((sum: number, r: any) => sum + Number(r.revenue_attributed ?? 0), 0);

  const bySource: Record<string, number> = {};
  for (const row of allRows) {
    const src = (row.lead_source as string) ?? "unknown";
    bySource[src] = (bySource[src] ?? 0) + 1;
  }

  return {
    totalLeads,
    convertedLeads,
    conversionRate,
    revenueAttributed: Math.round(revenueAttributed * 100) / 100,
    bySource,
  };
}
