import "server-only";

import type { Json } from "@/lib/database.types";
import { LEGAL_ENTITY } from "@/lib/legal-entity";
import { createServiceClient } from "@/lib/supabase/server";
import { recordPaymentEvidence } from "@/lib/payments/payment-events";

export async function createInvoice(input: { organizationId: string; patientId?: string; invoiceNumber: string; amountDue: number; traceId: string; dueDate?: string }) {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Invoices require Supabase service configuration.");
  const { data, error } = await (supabase as any).from("invoices").insert({
    organization_id: input.organizationId,
    patient_id: input.patientId ?? null,
    invoice_number: input.invoiceNumber,
    amount_due: input.amountDue,
    due_date: input.dueDate ?? null,
    metadata: {
      invoiceHeader: LEGAL_ENTITY.invoiceHeader,
      paymentRecipient: LEGAL_ENTITY.paymentRecipient,
      legalEntity: LEGAL_ENTITY.legalName,
      brand: LEGAL_ENTITY.brandName
    } as Json
  }).select("*").single();
  if (error) throw new Error(`Unable to create invoice: ${error.message}`);
  await recordPaymentEvidence({ organizationId: input.organizationId, traceId: input.traceId, patientId: input.patientId, action: "invoice_created", outcome: "created", amount: input.amountDue, metadata: { invoice_id: data.id } });
  return data;
}
