import "server-only";

import { produceEvidence } from "@/lib/evidence/evidence-producer";

export async function recordPaymentEvidence(input: { organizationId: string; traceId: string; patientId?: string; action: string; outcome: string; amount: number; metadata?: Record<string, unknown> }) {
  return produceEvidence({
    type: "PAYMENT_EVENT",
    organizationId: input.organizationId,
    traceId: input.traceId,
    patientId: input.patientId,
    actor: "stripe_gateway",
    source: "patient_commerce_os",
    action: input.action,
    outcome: input.outcome,
    revenueAmount: input.amount,
    metadata: input.metadata
  });
}
