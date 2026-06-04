import "server-only";

import { produceEvidence } from "@/lib/evidence/evidence-producer";
import { createServiceClient } from "@/lib/supabase/server";

export type FinancingProvider = "CareCredit" | "Sunbit" | "Proceed Finance";

export async function createFinancingReferral(input: { organizationId: string; patientId: string; treatmentPlanId?: string; provider: FinancingProvider; amount: number; traceId: string }) {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Financing referrals require Supabase service configuration.");
  const { data, error } = await (supabase as any).from("financing_referrals").insert({
    organization_id: input.organizationId,
    treatment_plan_id: input.treatmentPlanId ?? null,
    patient_id: input.patientId,
    provider: input.provider,
    referral_amount: input.amount
  }).select("*").single();
  if (error) throw new Error(`Unable to create financing referral: ${error.message}`);
  await produceEvidence({ type: "REVENUE_EVENT", organizationId: input.organizationId, traceId: input.traceId, patientId: input.patientId, actor: "financing_referral_engine", source: "financing", action: "referral_created", outcome: "sent", revenueAmount: input.amount, metadata: { financing_referral_id: data.id, provider: input.provider } });
  return data;
}
