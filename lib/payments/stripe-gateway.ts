import "server-only";

import { isStripeConfigured } from "@/lib/stripe/operations";
import { createPaymentLink } from "@/lib/payments/payment-link-engine";
import { createInvoice } from "@/lib/payments/invoice-engine";

export async function createTreatmentDeposit(input: { organizationId: string; patientId: string; treatmentPlanId: string; amount: number; traceId: string }) {
  return createPaymentLink({ ...input, description: "Treatment deposit" });
}

export async function createOutstandingBalanceInvoice(input: { organizationId: string; patientId: string; amountDue: number; traceId: string }) {
  return createInvoice({ ...input, invoiceNumber: `INV-${input.traceId.slice(0, 8)}` });
}

export function getStripeGatewayStatus() {
  return { configured: isStripeConfigured(), capabilities: ["Treatment Deposits", "Treatment Payments", "Outstanding Balance Payments", "Invoices", "Receipts", "Payment Links"] };
}
