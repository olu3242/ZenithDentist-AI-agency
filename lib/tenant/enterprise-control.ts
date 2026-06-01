import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  planKey: string;
  memberCount: number;
  healthScore: number;
  automationScore: number;
  runtimeScore: number;
  mrr: number;
  createdAt: string;
  lastActiveAt: string | null;
  status: "active" | "trial" | "churned" | "suspended";
}

export interface EnterpriseControlData {
  totalOrganizations: number;
  activeOrganizations: number;
  trialOrganizations: number;
  churnedOrganizations: number;
  totalMrr: number;
  totalArr: number;
  avgHealthScore: number;
  avgAutomationScore: number;
  organizations: OrganizationSummary[];
  platformMetrics: {
    totalWorkflowExecutions: number;
    totalEventsPublished: number;
    totalAIInsights: number;
    avgSuccessRate: number;
  };
  generatedAt: string;
}

export async function getEnterpriseControlData(limit = 50): Promise<EnterpriseControlData> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const windowStart = new Date(Date.now() - 30 * 86400000).toISOString();

  const empty: EnterpriseControlData = {
    totalOrganizations: 0, activeOrganizations: 0, trialOrganizations: 0, churnedOrganizations: 0,
    totalMrr: 0, totalArr: 0, avgHealthScore: 0, avgAutomationScore: 0, organizations: [],
    platformMetrics: { totalWorkflowExecutions: 0, totalEventsPublished: 0, totalAIInsights: 0, avgSuccessRate: 0 },
    generatedAt: now,
  };

  if (!supabase) return empty;

  const [orgsResult, subsResult, tracesResult, eventsResult] = await Promise.all([
    supabase.from("organizations").select("id, name, slug, created_at").order("created_at", { ascending: false }).limit(limit),
    (supabase as any).from("organization_subscriptions").select("organization_id, plan_key, status, seats_allowed").limit(limit * 2),
    supabase.from("automation_traces").select("organization_id, status").gte("started_at", windowStart).limit(2000),
    supabase.from("runtime_event_fabric_events").select("organization_id").gte("published_at", windowStart).limit(2000),
  ]);

  const orgs = orgsResult.data ?? [];
  const subs = (subsResult.data ?? []) as Array<{ organization_id: string; plan_key: string; status: string; seats_allowed: number }>;
  const traces = tracesResult.data ?? [];
  const events = eventsResult.data ?? [];

  const { PRICING_PLANS } = await import("@/lib/commercialization/pricing-engine");

  const tracesByOrg = traces.reduce<Record<string, typeof traces>>((acc, t) => {
    if (t.organization_id) { acc[t.organization_id] = acc[t.organization_id] ?? []; acc[t.organization_id].push(t); }
    return acc;
  }, {});

  const organizations: OrganizationSummary[] = orgs.map(org => {
    const sub = subs.find(s => s.organization_id === org.id);
    const orgTraces = tracesByOrg[org.id] ?? [];
    const succeeded = orgTraces.filter(t => t.status === "completed").length;
    const healthScore = orgTraces.length > 0 ? Math.round((succeeded / orgTraces.length) * 100) : 60;
    const planKey = (sub?.plan_key ?? "starter") as keyof typeof PRICING_PLANS;
    const planConfig = PRICING_PLANS[planKey];
    const mrr = planConfig?.monthlyPrice ?? 0;
    const subStatus = sub?.status ?? "trialing";
    const status: OrganizationSummary["status"] = subStatus === "active" ? "active" : subStatus === "trialing" ? "trial" : subStatus === "cancelled" ? "churned" : "active";

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      planKey: planKey,
      memberCount: sub?.seats_allowed ?? 1,
      healthScore,
      automationScore: Math.min(100, orgTraces.length * 2),
      runtimeScore: healthScore,
      mrr,
      createdAt: org.created_at,
      lastActiveAt: orgTraces[0] ? windowStart : null,
      status,
    };
  });

  const totalMrr = organizations.reduce((s, o) => s + o.mrr, 0);
  const totalTraces = traces.length;
  const totalSucceeded = traces.filter(t => t.status === "completed").length;

  logger.info("enterprise_control_loaded", { totalOrgs: organizations.length, totalMrr });

  return {
    totalOrganizations: organizations.length,
    activeOrganizations: organizations.filter(o => o.status === "active").length,
    trialOrganizations: organizations.filter(o => o.status === "trial").length,
    churnedOrganizations: organizations.filter(o => o.status === "churned").length,
    totalMrr,
    totalArr: totalMrr * 12,
    avgHealthScore: organizations.length > 0 ? Math.round(organizations.reduce((s, o) => s + o.healthScore, 0) / organizations.length) : 0,
    avgAutomationScore: organizations.length > 0 ? Math.round(organizations.reduce((s, o) => s + o.automationScore, 0) / organizations.length) : 0,
    organizations,
    platformMetrics: {
      totalWorkflowExecutions: totalTraces,
      totalEventsPublished: events.length,
      totalAIInsights: 0,
      avgSuccessRate: totalTraces > 0 ? Math.round((totalSucceeded / totalTraces) * 100) : 0,
    },
    generatedAt: now,
  };
}
