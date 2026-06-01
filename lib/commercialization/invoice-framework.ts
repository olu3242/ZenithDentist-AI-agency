import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  invoiceId: string;
  organizationId: string;
  organizationName: string;
  period: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "issued" | "paid" | "overdue" | "void";
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
}

export async function getInvoiceHistory(organizationId: string, limit = 12): Promise<Invoice[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await (supabase as any)
    .from("billing_events")
    .select("id, event_type, amount, currency, status, created_at, metadata")
    .eq("organization_id", organizationId)
    .in("event_type", ["invoice.paid", "invoice.created", "invoice.overdue"])
    .order("created_at", { ascending: false })
    .limit(limit) as { data: Array<Record<string, unknown>> | null };
  return (data ?? []).map(row => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const amount = (row.amount as number) ?? 0;
    const rowId = row.id as string;
    const rowStatus = row.status as string | null;
    const rowCreatedAt = row.created_at as string | null;
    return {
      invoiceId: rowId,
      organizationId,
      organizationName: (meta.organizationName as string) ?? "",
      period: (meta.period as string) ?? rowCreatedAt?.slice(0, 7) ?? "",
      lineItems: (meta.lineItems as InvoiceLineItem[]) ?? [
        { description: "Subscription", quantity: 1, unitPrice: amount, total: amount },
      ],
      subtotal: amount,
      tax: 0,
      total: amount,
      status: rowStatus === "succeeded" ? "paid" : ((rowStatus ?? "draft") as Invoice["status"]),
      issuedAt: rowCreatedAt ?? null,
      dueAt: null,
      paidAt: rowStatus === "succeeded" ? rowCreatedAt : null,
    };
  });
}

export async function getUpcomingInvoice(organizationId: string): Promise<Invoice | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data } = await (supabase as any)
    .from("organization_subscriptions")
    .select("plan_key, current_period_end, seats_allowed, metadata")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .maybeSingle() as { data: Record<string, unknown> | null };
  if (!data) return null;
  const { PRICING_PLANS } = await import("@/lib/commercialization/pricing-engine");
  const planKey = ((data.plan_key as string) ?? "starter") as keyof typeof PRICING_PLANS;
  const plan = PRICING_PLANS[planKey];
  const amount = plan?.monthlyPrice ?? 0;
  const periodEnd = data.current_period_end as string | null;
  return {
    invoiceId: `upcoming-${organizationId.slice(0, 8)}`,
    organizationId,
    organizationName: "",
    period: periodEnd?.slice(0, 7) ?? "",
    lineItems: [
      { description: `${plan?.name ?? planKey} Plan`, quantity: 1, unitPrice: amount, total: amount },
    ],
    subtotal: amount,
    tax: 0,
    total: amount,
    status: "draft",
    issuedAt: null,
    dueAt: periodEnd ?? null,
    paidAt: null,
  };
}
