import "server-only";

import type { Json } from "@/lib/database.types";
import { produceEvidence } from "@/lib/evidence/evidence-producer";
import { createPaymentLink } from "@/lib/payments/payment-link-engine";
import { createServiceClient } from "@/lib/supabase/server";

export async function createTreatmentPlan(input: { organizationId: string; patientId: string; treatmentName: string; treatmentCost: number; providerName?: string; traceId: string }) {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Treatment plans require Supabase service configuration.");
  const { data, error } = await (supabase as any).from("treatment_plans").insert({
    organization_id: input.organizationId,
    patient_id: input.patientId,
    treatment_name: input.treatmentName,
    treatment_cost: input.treatmentCost,
    provider_name: input.providerName ?? null,
    metadata: {} as Json
  }).select("*").single();
  if (error) throw new Error(`Unable to create treatment plan: ${error.message}`);
  await produceEvidence({ type: "REVENUE_EVENT", organizationId: input.organizationId, traceId: input.traceId, patientId: input.patientId, actor: "treatment_acceptance_os", source: "treatment_plan", action: "created", outcome: "pending_acceptance", revenueAmount: input.treatmentCost, metadata: { treatment_plan_id: data.id } });
  return data;
}

export async function acceptTreatmentPlan(input: { organizationId: string; patientId: string; treatmentPlanId: string; amount: number; traceId: string }) {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Treatment acceptance requires Supabase service configuration.");
  const paymentLink = await createPaymentLink({ organizationId: input.organizationId, patientId: input.patientId, treatmentPlanId: input.treatmentPlanId, amount: input.amount, description: "Accepted treatment payment", traceId: input.traceId });
  const { data, error } = await (supabase as any).from("treatment_acceptances").insert({
    organization_id: input.organizationId,
    treatment_plan_id: input.treatmentPlanId,
    patient_id: input.patientId,
    accepted_amount: input.amount,
    payment_link_id: paymentLink.id
  }).select("*").single();
  if (error) throw new Error(`Unable to accept treatment plan: ${error.message}`);
  await produceEvidence({ type: "REVENUE_EVENT", organizationId: input.organizationId, traceId: input.traceId, patientId: input.patientId, actor: "treatment_acceptance_os", source: "treatment_acceptance", action: "accepted", outcome: "payment_link_created", revenueAmount: input.amount, metadata: { treatment_acceptance_id: data.id, payment_link_id: paymentLink.id } });
  return { acceptance: data, paymentLink };
}
