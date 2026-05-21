import "server-only";

import { getPortalData, summarizePortal } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";
import { summarizeClientHealth } from "@/lib/alice/operational-intelligence";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";

export async function getClientOperationsState() {
  const [tenant, portal, runtime] = await Promise.all([getTenantData(), getPortalData(), getRuntimeHealthState()]);
  const summary = summarizePortal(portal);
  const clientHealth = runtime.domainHealth.map(domain => ({
    domain: domain.domain,
    workflowCount: domain.workflowCount,
    successRate: Math.round(domain.successRate * 100),
    reliabilityScore: domain.healthScore,
    alerts: runtime.unhealthyWorkflows.filter(workflow => workflow.workflowId.startsWith(domain.domain)).length
  }));
  const engagementScore = Math.round(Number(summary.latest.patient_engagement_rate ?? 0));
  const automationMaturityScore = Math.round(runtime.scores.observabilityScore * 0.45 + runtime.scores.healingScore * 0.35 + (runtime.traces.length ? 20 : 0));
  const operationalScore = runtime.scores.operationalScore || Math.round((engagementScore + automationMaturityScore) / 2);
  const reliabilityScore = runtime.scores.reliabilityScore;

  return {
    organization: tenant.organization,
    locations: tenant.locations,
    metrics: portal.metrics,
    runtime,
    summary,
    clientHealth,
    recommendations: [
      summarizeClientHealth({
        organizationName: tenant.organization.name,
        operationalScore,
        reliabilityScore,
        engagementScore,
        activeAlerts: runtime.unhealthyWorkflows.length
      }),
      runtime.slaBreaches.length
        ? `${runtime.slaBreaches.length} workflows need SLA review before the next operating cycle.`
        : "No live SLA breaches are currently detected.",
      runtime.deadLetters.length
        ? "Review replay queue and resolve dead-letter events before scaling outreach volume."
        : "Replay queue is clear for the current runtime window."
    ],
    scores: {
      operationalScore,
      automationMaturityScore,
      engagementScore,
      reliabilityScore,
      automationRoi: Number(summary.recoveredRevenue ?? 0),
      slaCompliance: runtime.traces.length ? Math.round(((runtime.traces.length - runtime.slaBreaches.length) / runtime.traces.length) * 100) : 0
    }
  };
}
