import "server-only";

import { summarizeAutomationHealth } from "@/lib/alice/operational-intelligence";
import { getClientOperationsState } from "@/lib/client-operations";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getRuntimeIncidents } from "@/lib/runtime/incident-management";
import { getOperationalMemoryState } from "@/lib/runtime/operational-memory";
import { getProviderHealth } from "@/lib/runtime/provider-health";
import { buildReplayCenterState } from "@/lib/runtime/replay-engine";

export interface ExecutiveReportSnapshot {
  title: string;
  summary: string;
  generatedAt: string;
  runtimeHealth: number;
  automationRoi: number;
  operationalMaturity: number;
  incidentCount: number;
  replayCandidates: number;
  slaCompliance: number;
  providerReliability: number;
  aliceInsights: string[];
  optimizationOpportunities: string[];
  exportFormats: Array<"pdf_ready_html" | "email_summary" | "operational_snapshot">;
}

export async function buildExecutiveReportSnapshot(): Promise<ExecutiveReportSnapshot> {
  const [runtime, clientState, incidents, providers, memory, aliceHealth] = await Promise.all([
    getRuntimeHealthState(),
    getClientOperationsState(),
    getRuntimeIncidents(),
    getProviderHealth(),
    getOperationalMemoryState(),
    summarizeAutomationHealth()
  ]);
  const replay = buildReplayCenterState(runtime);
  const providerReliability = providers.length ? Math.round(providers.reduce((sum, provider) => sum + provider.uptimeScore, 0) / providers.length) : 0;
  const slaCompliance = runtime.traces.length ? Math.round(((runtime.traces.length - runtime.slaBreaches.length) / runtime.traces.length) * 100) : 0;

  return {
    title: "Executive Operational Intelligence Report",
    summary: aliceHealth.summary,
    generatedAt: new Date().toISOString(),
    runtimeHealth: runtime.scores.operationalScore,
    automationRoi: Math.round(clientState.scores.automationRoi),
    operationalMaturity: clientState.scores.automationMaturityScore,
    incidentCount: incidents.length,
    replayCandidates: replay.candidates.length,
    slaCompliance,
    providerReliability,
    aliceInsights: [
      `${runtime.unhealthyWorkflows.length} workflows require operational review.`,
      `${memory.recurrenceSignals} recurring operational memory signals detected.`,
      `${replay.candidates.length} replay candidates are available for recovery review.`
    ],
    optimizationOpportunities: clientState.recommendations.slice(0, 5),
    exportFormats: ["pdf_ready_html", "email_summary", "operational_snapshot"]
  };
}

export function renderExecutiveReportHtml(report: ExecutiveReportSnapshot) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${report.title}</title></head><body><h1>${report.title}</h1><p>${report.summary}</p><ul><li>Runtime health: ${report.runtimeHealth}%</li><li>SLA compliance: ${report.slaCompliance}%</li><li>Provider reliability: ${report.providerReliability}%</li><li>Automation ROI: $${report.automationRoi.toLocaleString()}</li></ul></body></html>`;
}
