import "server-only";

import type { Json } from "@/lib/database.types";
import { env } from "@/lib/env";
import { LEGAL_ENTITY } from "@/lib/legal-entity";
import { createServiceClient } from "@/lib/supabase/server";
import { recordPaymentEvidence } from "@/lib/payments/payment-events";

export async function createPaymentLink(input: { organizationId: string; patientId?: string; treatmentPlanId?: string; amount: number; description: string; traceId: string }) {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Payment links require Supabase service configuration.");
  const url = `${env.NEXT_PUBLIC_SITE_URL}/payment/${input.traceId}`;
  const { data, error } = await (supabase as any).from("payment_links").insert({
    organization_id: input.organizationId,
    patient_id: input.patientId ?? null,
    treatment_plan_id: input.treatmentPlanId ?? null,
    url,
    amount: input.amount,
    status: "created",
    metadata: {
      description: input.description,
      stripe_configured: Boolean(env.STRIPE_API_KEY),
      payment_recipient: LEGAL_ENTITY.paymentRecipient,
      legal_entity: LEGAL_ENTITY.legalName,
      brand: LEGAL_ENTITY.brandName
    } as Json
  }).select("*").single();
  if (error) throw new Error(`Unable to create payment link: ${error.message}`);
  await recordPaymentEvidence({ organizationId: input.organizationId, traceId: input.traceId, patientId: input.patientId, action: "payment_link_created", outcome: "created", amount: input.amount, metadata: { payment_link_id: data.id } });
  return data;
}
