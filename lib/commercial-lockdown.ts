import "server-only";

import { getTenantData } from "@/lib/data/tenants";
import { LEGAL_ENTITY } from "@/lib/legal-entity";
import { createServiceClient } from "@/lib/supabase/server";

export interface CommercialPackageDefinition {
  key: string;
  name: string;
  setupFee: number;
  monthlyFee: number;
  sla: string;
  deliverables: { technical: string[]; operational: string[] };
  responsibilities: string[];
  successCriteria: string[];
  paymentGates: Array<{ key: string; name: string; percentage: number; trigger: string; criteria: string[] }>;
  stripeObjects: string[];
  legal: {
    legalEntity: string;
    brand: string;
    taxEntity: string;
    billingEntity: string;
    contractEntity: string;
    paymentRecipient: string;
  };
}

export const commercialPackages: CommercialPackageDefinition[] = [
  {
    key: "revenue_recovery_system",
    name: "Revenue Recovery System",
    setupFee: 2500,
    monthlyFee: 1500,
    sla: "Business Hours Support",
    deliverables: {
      technical: ["PMS Connection", "Communication Setup", "Recall Automation", "Review Automation", "Treatment Follow-Up Automation", "Dashboard Access"],
      operational: ["Workflow Configuration", "Templates Configuration", "Testing", "Training"]
    },
    responsibilities: ["PMS Access", "Team Availability", "Domain Access", "Review Approval", "Training Attendance"],
    successCriteria: ["PMS Connected", "SMS Active", "Email Active", "Recall Active", "Review Active", "Training Complete"],
    paymentGates: [
      { key: "contract", name: "Upon Contract", percentage: 50, trigger: "contract_signed", criteria: ["Contract executed"] },
      { key: "go_live", name: "Upon Go-Live", percentage: 50, trigger: "go_live_certified", criteria: ["Go-Live Certified"] }
    ],
    stripeObjects: ["Setup Fee", "Monthly Subscription", "Professional Services", "Expansion Work"],
    legal: legalGovernance()
  },
  {
    key: "ai_practice_growth_system",
    name: "AI Practice Growth System",
    setupFee: 5000,
    monthlyFee: 3500,
    sla: "Priority Support",
    deliverables: {
      technical: ["Everything in Revenue Recovery System", "ALICE Configuration", "Video Intelligence Setup", "Revenue Attribution Setup", "Executive Reporting Setup", "Customer Success Tracking"],
      operational: ["Monthly Executive Report", "Revenue Review", "Workflow Optimization", "AI Recommendations Review", "Quarterly Business Review"]
    },
    responsibilities: ["PMS Access", "Team Availability", "Domain Access", "Review Approval", "Training Attendance", "Executive Review Attendance"],
    successCriteria: ["All Integrations Connected", "Executive Dashboard Active", "Revenue Attribution Active", "ALICE Operational", "Evidence Records Generated"],
    paymentGates: [
      { key: "contract", name: "Contract", percentage: 40, trigger: "contract_signed", criteria: ["Contract executed"] },
      { key: "configuration_complete", name: "Configuration Complete", percentage: 40, trigger: "configuration_complete", criteria: ["Integrations connected", "Dashboards configured"] },
      { key: "go_live", name: "Go-Live", percentage: 20, trigger: "go_live_certified", criteria: ["Go-Live Certified"] }
    ],
    stripeObjects: ["Setup Fee", "Monthly Subscription", "Professional Services", "Expansion Work"],
    legal: legalGovernance()
  },
  {
    key: "managed_ai_operations",
    name: "Managed AI Operations",
    setupFee: 10000,
    monthlyFee: 7500,
    sla: "Dedicated SLA, Incident Management, Recovery Monitoring",
    deliverables: {
      technical: ["Everything in AI Practice Growth System", "Custom Workflows", "Executive Command Center", "Incident Management", "SLA Management", "Priority Support"],
      operational: ["Dedicated Success Manager", "Dedicated Implementation Manager", "Custom Workflow Management", "Executive Operating Reviews"]
    },
    responsibilities: ["Executive Sponsor", "PMS Access", "Team Availability", "Domain Access", "Workflow Approval", "Training Attendance"],
    successCriteria: ["Dedicated SLA Active", "Incident Management Active", "Recovery Monitoring Active", "Executive Command Center Active", "Custom Workflows Accepted"],
    paymentGates: [
      { key: "contract", name: "Contract", percentage: 30, trigger: "contract_signed", criteria: ["Contract executed"] },
      { key: "build_complete", name: "Build Complete", percentage: 30, trigger: "build_complete", criteria: ["Custom build accepted"] },
      { key: "testing_complete", name: "Testing Complete", percentage: 20, trigger: "testing_complete", criteria: ["Testing passed"] },
      { key: "go_live", name: "Go-Live", percentage: 20, trigger: "go_live_certified", criteria: ["Go-Live Certified"] }
    ],
    stripeObjects: ["Setup Fee", "Monthly Subscription", "Professional Services", "Expansion Work"],
    legal: legalGovernance()
  }
];

export interface CommercialLockdownState {
  configured: boolean;
  generatedAt: string;
  packages: CommercialPackageDefinition[];
  metrics: {
    mrr: number;
    arr: number;
    collections: number;
    outstandingInvoices: number;
    expansionRevenue: number;
    implementationRevenue: number;
    renewalRevenue: number;
    churnRevenue: number;
    billableMilestones: number;
    overdueMilestones: number;
    changeRequests: number;
    expansionQuotes: number;
  };
  clients: Array<{ id: string; packageKey: string; contractValue: number; implementationStatus: string; goLiveStatus: string; monthlyRevenue: number; renewalDate: string; expansionPotential: number; healthScore: number; paymentStatus: string; riskStatus: string; legalEntity: string; billingEntity: string; contractEntity: string }>;
  milestones: Array<{ id: string; gate: string; amount: number; dueDate: string; status: string; blockedReason: string }>;
  changeRequests: Array<{ id: string; title: string; scope: string; status: string; amount: number }>;
  expansionQuotes: Array<{ id: string; type: string; amount: number; status: string }>;
  offboarding: Array<{ id: string; status: string; noticeReceived: boolean; balancePaid: boolean; exportGenerated: boolean; complete: boolean }>;
}

export async function getCommercialLockdownState(): Promise<CommercialLockdownState> {
  const tenant = await getTenantData();
  const organizationId = tenant.tenant.organizationId ?? tenant.organization.id;
  const supabase = createServiceClient();
  if (!supabase) return buildCommercialState(false);
  const client = supabase as any;
  const [controls, milestones, invoices, transactions, expansions, renewals, changes, quotes, offboarding] = await Promise.all([
    client.from("client_commercial_controls").select("*").eq("organization_id", organizationId).order("updated_at", { ascending: false }).limit(200),
    client.from("client_payment_milestones").select("*").eq("organization_id", organizationId).order("due_date", { ascending: true }).limit(200),
    client.from("invoices").select("*").eq("organization_id", organizationId).limit(500),
    client.from("transactions").select("*").eq("organization_id", organizationId).limit(500),
    client.from("expansions").select("*").eq("organization_id", organizationId).limit(200),
    client.from("renewals").select("*").eq("organization_id", organizationId).limit(200),
    client.from("change_requests").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
    client.from("expansion_quotes").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
    client.from("client_offboarding_checklists").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100)
  ]);
  return buildCommercialState(true, {
    controls: controls.data ?? [],
    milestones: milestones.data ?? [],
    invoices: invoices.data ?? [],
    transactions: transactions.data ?? [],
    expansions: expansions.data ?? [],
    renewals: renewals.data ?? [],
    changes: changes.data ?? [],
    quotes: quotes.data ?? [],
    offboarding: offboarding.data ?? []
  });
}

function buildCommercialState(configured: boolean, rows: Record<string, any[]> = {}): CommercialLockdownState {
  const controls = rows.controls ?? [];
  const milestones = rows.milestones ?? [];
  const invoices = rows.invoices ?? [];
  const transactions = rows.transactions ?? [];
  const expansions = rows.expansions ?? [];
  const renewals = rows.renewals ?? [];
  const changes = rows.changes ?? [];
  const quotes = rows.quotes ?? [];
  const offboarding = rows.offboarding ?? [];
  const mrr = sum(controls, "monthly_revenue");
  const collections = transactions.filter(row => row.status === "paid" || row.status === "succeeded").reduce((total, row) => total + Number(row.amount ?? 0), 0);
  const outstandingInvoices = invoices.filter(row => row.status !== "paid").reduce((total, row) => total + Number(row.amount_due ?? 0) - Number(row.amount_paid ?? 0), 0);

  return {
    configured,
    generatedAt: new Date().toISOString(),
    packages: commercialPackages,
    metrics: {
      mrr,
      arr: mrr * 12,
      collections,
      outstandingInvoices,
      expansionRevenue: sum(expansions, "expansion_value") + sum(quotes.filter(row => row.status === "approved"), "quote_amount"),
      implementationRevenue: sum(milestones.filter(row => row.status === "paid"), "amount"),
      renewalRevenue: sum(renewals, "renewal_value"),
      churnRevenue: sum(controls.filter(row => row.risk_status === "churned"), "monthly_revenue"),
      billableMilestones: milestones.filter(row => row.status === "billable").length,
      overdueMilestones: milestones.filter(row => row.status === "overdue").length,
      changeRequests: changes.filter(row => row.status !== "completed").length,
      expansionQuotes: quotes.filter(row => row.status !== "declined").length
    },
    clients: controls.map(row => ({
      id: row.id,
      packageKey: row.package_key,
      contractValue: Number(row.contract_value ?? 0),
      implementationStatus: row.implementation_status,
      goLiveStatus: row.go_live_status,
      monthlyRevenue: Number(row.monthly_revenue ?? 0),
      renewalDate: row.renewal_date ?? "Unscheduled",
      expansionPotential: Number(row.expansion_potential ?? 0),
      healthScore: Number(row.health_score ?? 0),
      paymentStatus: row.payment_status,
      riskStatus: row.risk_status,
      legalEntity: row.legal_entity ?? LEGAL_ENTITY.legalName,
      billingEntity: row.billing_entity ?? LEGAL_ENTITY.billingEntity,
      contractEntity: row.contract_entity ?? LEGAL_ENTITY.contractEntity
    })),
    milestones: milestones.map(row => ({ id: row.id, gate: row.gate_name, amount: Number(row.amount ?? 0), dueDate: row.due_date ?? "Unscheduled", status: row.status, blockedReason: row.blocked_reason ?? "" })),
    changeRequests: changes.map(row => ({ id: row.id, title: row.request_title, scope: row.request_scope, status: row.status, amount: Number(row.quoted_amount ?? 0) })),
    expansionQuotes: quotes.map(row => ({ id: row.id, type: row.expansion_type, amount: Number(row.quote_amount ?? 0), status: row.status })),
    offboarding: offboarding.map(row => ({ id: row.id, status: row.offboarding_status, noticeReceived: Boolean(row.notice_received), balancePaid: Boolean(row.outstanding_balance_paid), exportGenerated: Boolean(row.export_package_generated), complete: Boolean(row.checklist_complete) }))
  };
}

function sum(rows: any[], key: string) {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function legalGovernance() {
  return {
    legalEntity: LEGAL_ENTITY.legalName,
    brand: LEGAL_ENTITY.brandName,
    taxEntity: LEGAL_ENTITY.taxEntity,
    billingEntity: LEGAL_ENTITY.billingEntity,
    contractEntity: LEGAL_ENTITY.contractEntity,
    paymentRecipient: LEGAL_ENTITY.paymentRecipient
  };
}
