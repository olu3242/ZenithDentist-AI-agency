// Mission Control — Agent OS Agent Center (Batch 6)
// Read-only ops view over Batches 1-10: registry, executions, revenue,
// approvals, learning, and analytics. Follows the existing Mission Control
// panel convention (server component, plain sections/tables, no new UI framework).

import { AppShell } from "@/components/app/app-shell";
import { getTenantData } from "@/lib/data/tenants";
import { getCurrentZenithRole } from "@/lib/server-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { AgentAnalyticsEngine } from "@/packages/agent-os/analytics/AgentAnalyticsEngine";
import { AgentScorecardEngine } from "@/packages/agent-os/analytics/AgentScorecardEngine";
import { AgentInsightsEngine } from "@/packages/agent-os/analytics/AgentInsightsEngine";
import { ApprovalRequestStore } from "@/packages/agent-os/approvals/ApprovalRequestStore";
import { AgentRevenueAttributionStore } from "@/packages/agent-os/revenue/AgentRevenueAttributionStore";
import { LearningEventStore } from "@/packages/agent-os/learning/LearningEventStore";
import { RevenueLeakageEngine } from "@/packages/agent-os/revenue-intelligence/RevenueLeakageEngine";
import { OpportunityEngine } from "@/packages/agent-os/revenue-intelligence/OpportunityEngine";
import { getEducationPipeline, getAcceptanceRisk, getRevenueInfluence } from "@/lib/treatment-visualization";

interface AgentRegistryRow {
  id: string;
  agent_id: string;
  agent_name: string;
  title: string | null;
  status: string;
  version: string;
}

async function loadRegistry(): Promise<AgentRegistryRow[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await (supabase as any)
    .from("agent_registry")
    .select("id, agent_id, agent_name, title, status, version")
    .order("agent_name", { ascending: true });
  return (data ?? []) as AgentRegistryRow[];
}

async function loadCapabilityCounts(agentIds: string[]): Promise<Record<string, number>> {
  const supabase = createServiceClient();
  const counts: Record<string, number> = {};
  if (!supabase || agentIds.length === 0) return counts;
  const { data } = await (supabase as any).from("agent_capabilities").select("agent_id").in("agent_id", agentIds);
  for (const row of data ?? []) {
    counts[row.agent_id] = (counts[row.agent_id] ?? 0) + 1;
  }
  return counts;
}

async function loadLastExecution(agentIds: string[]): Promise<Record<string, string>> {
  const supabase = createServiceClient();
  const lastByAgent: Record<string, string> = {};
  if (!supabase || agentIds.length === 0) return lastByAgent;
  const { data } = await (supabase as any)
    .from("agent_executions")
    .select("agent_id, started_at")
    .in("agent_id", agentIds)
    .order("started_at", { ascending: false });
  for (const row of data ?? []) {
    if (!lastByAgent[row.agent_id]) lastByAgent[row.agent_id] = row.started_at;
  }
  return lastByAgent;
}

export default async function AgentCenterPage() {
  const [tenantData, role, registry] = await Promise.all([
    getTenantData(),
    getCurrentZenithRole("super_admin"),
    loadRegistry()
  ]);

  const agentIds = registry.map(agent => agent.id);
  const [capabilityCounts, lastExecutions, pendingApprovals] = await Promise.all([
    loadCapabilityCounts(agentIds),
    loadLastExecution(agentIds),
    ApprovalRequestStore.listPending()
  ]);

  const scorecards = await Promise.all(registry.map(agent => AgentScorecardEngine.getScorecard(agent.id)));
  const stats = await Promise.all(registry.map(agent => AgentAnalyticsEngine.getAgentStats(agent.id)));
  const insights = await AgentInsightsEngine.getInsights();

  const activeAgents = registry.filter(agent => agent.status === "active").length;
  const executionsToday = stats.reduce((sum, stat) => sum + stat.executionsCount, 0);
  const revenueInfluenced = stats.reduce((sum, stat) => sum + stat.revenueInfluenced, 0);
  const automationCoverageAvg =
    stats.length > 0 ? stats.reduce((sum, stat) => sum + stat.automationCoverage, 0) / stats.length : 0;
  const successRateAvg = stats.length > 0 ? stats.reduce((sum, stat) => sum + stat.successRate, 0) / stats.length : 0;
  const failedExecutions = scorecards.filter(card => card.healthScore === "F").length;
  const overallHealthGrade = AgentScorecardEngine.gradeFromSuccessRate(successRateAvg);

  const revenueSummary = tenantData.organization?.id
    ? await AgentRevenueAttributionStore.getAttributionSummary(tenantData.organization.id)
    : { totalRevenue: 0, byAgent: {}, byRevenueType: {}, recordCount: 0 };

  // Revenue Workforce (Batch 11-15, Phase 6) — IVY/FINN/MAX/NOVA/ALICE.
  // Read-only: reuses AgentAnalyticsEngine stats + AgentRevenueAttributionStore
  // summary already computed above, plus ALICE's RevenueLeakageEngine /
  // OpportunityEngine for at-risk / opportunity figures. No new aggregation
  // pipeline.
  const WORKFORCE_SLUGS = ["ivy", "finn", "max", "nova", "alice"] as const;
  const workforceAgents = registry.filter(agent => (WORKFORCE_SLUGS as readonly string[]).includes(agent.agent_id));

  const [leakage, opportunities] = tenantData.organization?.id
    ? await Promise.all([
        RevenueLeakageEngine.detectLeakage(tenantData.organization.id),
        OpportunityEngine.detectOpportunities(tenantData.organization.id)
      ])
    : [[], []];

  const revenueAtRisk = leakage.reduce((sum, entry) => sum + entry.revenueAtRisk, 0);
  const revenueOpportunities = opportunities.reduce((sum, opp) => sum + opp.potentialRevenue, 0);

  const workforceCards = workforceAgents.map(agent => {
    const stat = stats.find(s => s.agentId === agent.id);
    const revenue = stat?.revenueInfluenced ?? 0;
    return {
      slug: agent.agent_id,
      name: agent.agent_name,
      title: agent.title,
      revenueRecovered: revenue,
      executions: stat?.executionsCount ?? 0,
      successRate: stat?.successRate ?? 0,
      // ALICE doesn't execute patient-facing actions herself — show
      // leakage/opportunity instead of an execution-driven figure.
      revenueAtRisk: agent.agent_id === "alice" ? revenueAtRisk : undefined,
      revenueOpportunities: agent.agent_id === "alice" ? revenueOpportunities : undefined
    };
  });

  // Treatment Visualization Journey (TVA) — Education Pipeline / Acceptance
  // Risk / Revenue Influence. Reuses lib/treatment-visualization, no new
  // aggregation pipeline.
  const [educationPipeline, acceptanceRisk, treatmentRevenueInfluence] = tenantData.organization?.id
    ? await Promise.all([
        getEducationPipeline(tenantData.organization.id),
        getAcceptanceRisk(tenantData.organization.id),
        getRevenueInfluence(tenantData.organization.id)
      ])
    : [
        { pending: 0, educationSent: 0, viewed: 0, accepted: 0, declined: 0, failed: 0 },
        { atRiskCount: 0, revenueAtRisk: 0 },
        { revenueGenerated: 0, treatmentsAccepted: 0 }
      ];

  const learningEventsByAgent = await Promise.all(
    registry.slice(0, 9).map(async agent => ({
      agentId: agent.agent_id,
      events: await LearningEventStore.listEvents(agent.id, 5)
    }))
  );

  return (
    <AppShell role={role} organization={tenantData.organization} locations={tenantData.locations}>
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="rounded border border-line bg-white p-5 shadow-sm">
          <p className="brand-kicker">Agent OS</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Agent Center</h1>
          <p className="mt-2 max-w-4xl text-base font-semibold text-muted">
            Read-only operations view over the agent registry, executions, revenue attribution, approvals, learning
            loop, and analytics layers.
          </p>
        </header>

        {/* Overview */}
        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-ink">Overview</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Active Agents", value: activeAgents },
              { label: "Executions Today", value: executionsToday },
              { label: "Revenue Influenced", value: `$${revenueInfluenced.toFixed(2)}` },
              { label: "Automation Coverage", value: `${automationCoverageAvg.toFixed(1)}%` },
              { label: "Success Rate", value: `${successRateAvg.toFixed(1)}%` },
              { label: "Pending Approvals", value: pendingApprovals.length },
              { label: "Failed Executions", value: failedExecutions },
              { label: "Agent Health Score", value: overallHealthGrade }
            ].map(item => (
              <div key={item.label} className="rounded border border-line bg-paper p-4">
                <p className="text-xs font-black uppercase tracking-wider text-muted">{item.label}</p>
                <strong className="mt-2 block text-2xl font-black text-ink">{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        {/* Registry */}
        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-ink">Registry</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-black uppercase tracking-wider text-muted">
                  <th className="py-2 pr-4">Agent</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Capabilities</th>
                  <th className="py-2 pr-4">Version</th>
                  <th className="py-2 pr-4">Last Execution</th>
                  <th className="py-2 pr-4">Health Score</th>
                </tr>
              </thead>
              <tbody>
                {registry.map(agent => {
                  const scorecard = scorecards.find(card => card.agentId === agent.id);
                  return (
                    <tr key={agent.id} className="border-b border-line/60">
                      <td className="py-2 pr-4 font-black text-ink">{agent.agent_name}</td>
                      <td className="py-2 pr-4 text-muted">{agent.title ?? "—"}</td>
                      <td className="py-2 pr-4 text-muted">{agent.status}</td>
                      <td className="py-2 pr-4 text-muted">{capabilityCounts[agent.id] ?? 0}</td>
                      <td className="py-2 pr-4 text-muted">{agent.version}</td>
                      <td className="py-2 pr-4 text-muted">
                        {lastExecutions[agent.id] ? new Date(lastExecutions[agent.id]).toLocaleString() : "—"}
                      </td>
                      <td className="py-2 pr-4 font-black text-ink">{scorecard?.healthScore ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Executions */}
        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-ink">Executions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {stats.map(stat => (
              <div key={stat.agentId} className="rounded border border-line bg-paper p-4">
                <p className="text-xs font-black uppercase tracking-wider text-muted">{stat.agentId}</p>
                <strong className="mt-2 block text-xl font-black text-ink">{stat.executionsCount} executions</strong>
                <p className="mt-1 text-sm font-semibold text-muted">{stat.successRate.toFixed(1)}% success rate</p>
              </div>
            ))}
          </div>
        </section>

        {/* Revenue */}
        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-ink">Revenue</h2>
          <p className="mt-2 text-sm font-semibold text-muted">
            Total attributed revenue: ${revenueSummary.totalRevenue.toFixed(2)} across {revenueSummary.recordCount}{" "}
            records.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(revenueSummary.byRevenueType).map(([type, amount]) => (
              <div key={type} className="rounded border border-line bg-paper p-4">
                <p className="text-xs font-black uppercase tracking-wider text-muted">{type}</p>
                <strong className="mt-2 block text-xl font-black text-ink">${amount.toFixed(2)}</strong>
              </div>
            ))}
          </div>
        </section>

        {/* Revenue Workforce */}
        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-ink">Revenue Workforce</h2>
          <p className="mt-2 text-sm font-semibold text-muted">
            IVY (patient success), FINN (financial recovery), MAX (operations), NOVA (growth), and ALICE (intelligence)
            — revenue recovered, executions, and (for ALICE) revenue at risk / opportunities.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {workforceCards.map(card => (
              <div key={card.slug} className="rounded border border-line bg-paper p-4">
                <p className="text-xs font-black uppercase tracking-wider text-muted">
                  {card.name} {card.title ? `— ${card.title}` : ""}
                </p>
                <strong className="mt-2 block text-xl font-black text-ink">${card.revenueRecovered.toFixed(2)}</strong>
                <p className="mt-1 text-sm font-semibold text-muted">
                  {card.executions} executions, {card.successRate.toFixed(1)}% success
                </p>
                {card.revenueAtRisk !== undefined ? (
                  <p className="mt-1 text-sm font-semibold text-muted">Revenue at risk: ${card.revenueAtRisk.toFixed(2)}</p>
                ) : null}
                {card.revenueOpportunities !== undefined ? (
                  <p className="mt-1 text-sm font-semibold text-muted">
                    Revenue opportunities: ${card.revenueOpportunities.toFixed(2)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* Treatment Visualization Journey (TVA) */}
        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-ink">Treatment Visualization Journey</h2>
          <p className="mt-2 text-sm font-semibold text-muted">
            TVA (Treatment Visualization Agent) — education pipeline, acceptance risk, and revenue influence for
            unscheduled high-value treatment plans.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded border border-line bg-paper p-4">
              <p className="text-xs font-black uppercase tracking-wider text-muted">Education Pipeline</p>
              <strong className="mt-2 block text-xl font-black text-ink">
                {educationPipeline.pending} pending · {educationPipeline.educationSent} sent · {educationPipeline.viewed} viewed
              </strong>
              <p className="mt-1 text-sm font-semibold text-muted">
                {educationPipeline.accepted} accepted, {educationPipeline.declined} declined, {educationPipeline.failed} failed
              </p>
            </div>
            <div className="rounded border border-line bg-paper p-4">
              <p className="text-xs font-black uppercase tracking-wider text-muted">Acceptance Risk</p>
              <strong className="mt-2 block text-2xl font-black text-ink">{acceptanceRisk.atRiskCount}</strong>
              <p className="mt-1 text-sm font-semibold text-muted">${acceptanceRisk.revenueAtRisk.toFixed(2)} revenue at risk</p>
            </div>
            <div className="rounded border border-line bg-paper p-4">
              <p className="text-xs font-black uppercase tracking-wider text-muted">Revenue Influence</p>
              <strong className="mt-2 block text-2xl font-black text-ink">${treatmentRevenueInfluence.revenueGenerated.toFixed(2)}</strong>
              <p className="mt-1 text-sm font-semibold text-muted">{treatmentRevenueInfluence.treatmentsAccepted} treatments accepted</p>
            </div>
          </div>
        </section>

        {/* Approvals */}
        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-ink">Approvals</h2>
          <p className="mt-2 text-sm font-semibold text-muted">{pendingApprovals.length} pending requests.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-black uppercase tracking-wider text-muted">
                  <th className="py-2 pr-4">Agent</th>
                  <th className="py-2 pr-4">Action Type</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Requested At</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.map(req => (
                  <tr key={req.id} className="border-b border-line/60">
                    <td className="py-2 pr-4 text-ink">{req.agent_id}</td>
                    <td className="py-2 pr-4 text-muted">{req.action_type}</td>
                    <td className="py-2 pr-4 text-muted">{req.status}</td>
                    <td className="py-2 pr-4 text-muted">{new Date(req.requested_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Learning */}
        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-ink">Learning</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {learningEventsByAgent.map(entry => (
              <div key={entry.agentId} className="rounded border border-line bg-paper p-4">
                <p className="text-xs font-black uppercase tracking-wider text-muted">{entry.agentId}</p>
                <strong className="mt-2 block text-xl font-black text-ink">{entry.events.length} recent events</strong>
              </div>
            ))}
          </div>
        </section>

        {/* Health */}
        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-ink">Health</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scorecards.map(card => (
              <div key={card.agentId} className="rounded border border-line bg-paper p-4">
                <p className="text-xs font-black uppercase tracking-wider text-muted">{card.agentId}</p>
                <strong className="mt-2 block text-2xl font-black text-ink">{card.healthScore}</strong>
                <p className="mt-1 text-sm font-semibold text-muted">
                  {card.executions} executions, {card.successRate.toFixed(1)}% success
                </p>
              </div>
            ))}
          </div>
          {insights.length > 0 ? (
            <div className="mt-4 space-y-2">
              {insights.map((insight, idx) => (
                <p key={`${insight.agentId}-${idx}`} className="text-sm font-semibold text-muted">
                  [{insight.severity}] {insight.agentId}: {insight.detail}
                </p>
              ))}
            </div>
          ) : null}
        </section>

        {/* Settings */}
        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-ink">Settings</h2>
          <p className="mt-2 text-sm font-semibold text-muted">
            Approval rules and agent configuration are managed via the agent_approval_rules table. A dedicated
            settings UI is out of scope for this read-only ops view.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
