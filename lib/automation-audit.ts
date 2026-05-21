import "server-only";

import { automationRegistry } from "@/lib/automation/registry";
import { getRuntimeHealthState, type RuntimeHealthState } from "@/lib/runtime/automation-health";
import type { AutomationBlueprint, AutomationCoverageClassification, AutomationDomain } from "@/types/automation";

export interface AutomationCoverageResult {
  id: string;
  blueprintId: string;
  domain: AutomationDomain;
  name: string;
  classification: AutomationCoverageClassification;
  missingControls: string[];
  missingRuntime: string[];
  aliceVisibilityScore: number;
  replayReadinessScore: number;
  observabilityScore: number;
  slaCoverageScore: number;
  runtimeTraceCount: number;
}

export interface AutomationAuditRun {
  id: string;
  runAt: string;
  totalBlueprints: number;
  completeCount: number;
  partialCount: number;
  declaredOnlyCount: number;
  missingRuntimeCount: number;
  unobservableCount: number;
  criticalGapCount: number;
  coverageScore: number;
  criticalGaps: string[];
  recommendations: string[];
}

export interface AutomationAuditState {
  blueprints: AutomationBlueprint[];
  auditRun: AutomationAuditRun;
  coverageResults: AutomationCoverageResult[];
  domainCoverage: Array<{ domain: AutomationDomain; complete: number; total: number; score: number }>;
  criticalGaps: string[];
  e2eChecklist: Array<{ label: string; complete: boolean; detail: string }>;
}

export async function getAutomationAuditState(): Promise<AutomationAuditState> {
  const runtime = await getRuntimeHealthState();
  return buildAutomationAudit(runtime);
}

export function buildAutomationAudit(runtime: RuntimeHealthState): AutomationAuditState {
  const coverageResults = automationRegistry.map(blueprint => evaluateBlueprint(blueprint, runtime));
  const completeCount = coverageResults.filter(result => result.classification === "COMPLETE").length;
  const partialCount = coverageResults.filter(result => result.classification === "PARTIAL").length;
  const declaredOnlyCount = coverageResults.filter(result => result.classification === "DECLARED_ONLY").length;
  const missingRuntimeCount = coverageResults.filter(result => result.classification === "MISSING_RUNTIME").length;
  const unobservableCount = coverageResults.filter(result => result.classification === "UNOBSERVABLE").length;
  const criticalGapCount = coverageResults.filter(result => result.classification === "CRITICAL_GAP").length;
  const coverageScore = Math.round(
    coverageResults.reduce(
      (sum, result) => sum + result.aliceVisibilityScore + result.replayReadinessScore + result.observabilityScore + result.slaCoverageScore,
      0
    ) / Math.max(1, coverageResults.length * 4)
  );
  const criticalGaps = coverageResults
    .filter(result => result.classification === "CRITICAL_GAP" || result.classification === "UNOBSERVABLE")
    .map(result => `${result.name}: ${[...result.missingControls, ...result.missingRuntime].slice(0, 2).join(", ")}`)
    .slice(0, 8);

  const auditRun: AutomationAuditRun = {
    id: "automation-audit-runtime",
    runAt: new Date().toISOString(),
    totalBlueprints: automationRegistry.length,
    completeCount,
    partialCount,
    declaredOnlyCount,
    missingRuntimeCount,
    unobservableCount,
    criticalGapCount,
    coverageScore,
    criticalGaps,
    recommendations: [
      "Instrument all registry workflows with automation traces before treating them as runtime complete.",
      "Route unresolved failures into dead letters with replay decisions and remediation guidance.",
      "Keep ALICE grounded through trace history, dead letters, SLA breaches, and registry-defined surfaces.",
      "Promote workflows from declared-only to complete only after live traces prove runtime coverage."
    ]
  };

  const domains = [...new Set(automationRegistry.map(blueprint => blueprint.domain))];
  const domainCoverage = domains.map(domain => {
    const rows = coverageResults.filter(result => result.domain === domain);
    const complete = rows.filter(row => row.classification === "COMPLETE").length;
    return { domain, complete, total: rows.length, score: Math.round((complete / Math.max(1, rows.length)) * 100) };
  });

  return {
    blueprints: automationRegistry,
    auditRun,
    coverageResults,
    domainCoverage,
    criticalGaps,
    e2eChecklist: buildChecklist(coverageResults)
  };
}

function evaluateBlueprint(blueprint: AutomationBlueprint, runtime: RuntimeHealthState): AutomationCoverageResult {
  const traces = runtime.traces.filter(trace => trace.workflow_id === blueprint.id);
  const missingControls = [
    blueprint.retryEnabled ? null : "retry strategy",
    blueprint.replayRequired ? null : "replay strategy",
    blueprint.deadLetterRequired ? null : "dead-letter routing",
    blueprint.slaMinutes ? null : "SLA expectation"
  ].filter(Boolean) as string[];
  const missingRuntime = [
    traces.length ? null : "runtime trace instrumentation",
    blueprint.queueHandlers.length ? null : "queue handler",
    blueprint.emittedEvents.length ? null : "event emission",
    blueprint.aliceGroundingSurfaces.length ? null : "ALICE grounding",
    runtime.domainHealth.some(domain => domain.domain === blueprint.domain) ? null : "runtime health scoring"
  ].filter(Boolean) as string[];
  const observabilityValues = Object.values(blueprint.observability);
  const observabilityScore = Math.round((observabilityValues.filter(Boolean).length / observabilityValues.length) * 100);
  const aliceVisibilityScore = Math.min(100, blueprint.aliceGroundingSurfaces.length * 20);
  const replayReadinessScore = blueprint.replayRequired && blueprint.retryEnabled && blueprint.deadLetterRequired ? 100 : 50;
  const slaCoverageScore = blueprint.slaMinutes ? 100 : 0;

  return {
    id: `coverage-${blueprint.id}`,
    blueprintId: blueprint.id,
    domain: blueprint.domain,
    name: blueprint.name,
    classification: classifyCoverage({ blueprint, traces, missingControls, missingRuntime, observabilityScore }),
    missingControls,
    missingRuntime,
    aliceVisibilityScore,
    replayReadinessScore,
    observabilityScore,
    slaCoverageScore,
    runtimeTraceCount: traces.length
  };
}

function classifyCoverage(input: {
  blueprint: AutomationBlueprint;
  traces: unknown[];
  missingControls: string[];
  missingRuntime: string[];
  observabilityScore: number;
}): AutomationCoverageClassification {
  if (input.observabilityScore < 100) return "UNOBSERVABLE";
  if (!input.blueprint.queueHandlers.length || !input.blueprint.emittedEvents.length) return "CRITICAL_GAP";
  if (!input.traces.length) return "DECLARED_ONLY";
  if (input.missingRuntime.length) return "MISSING_RUNTIME";
  if (input.missingControls.length) return "PARTIAL";
  return "COMPLETE";
}

function buildChecklist(results: AutomationCoverageResult[]) {
  return [
    { label: "Registry entry exists for each required workflow", complete: automationRegistry.length >= 10, detail: "Canonical registry is the single source of workflow truth." },
    { label: "Event emissions are declared", complete: results.every(result => !result.missingRuntime.includes("event emission")), detail: "Each workflow declares emitted operational intelligence events." },
    { label: "Queue handlers are declared", complete: results.every(result => !result.missingRuntime.includes("queue handler")), detail: "Each workflow declares queue handler ownership." },
    { label: "Runtime trace instrumentation exists", complete: results.every(result => result.runtimeTraceCount > 0), detail: "Live traces prove instrumentation beyond declaration." },
    { label: "Replay strategy exists", complete: results.every(result => result.replayReadinessScore >= 100), detail: "Retry, replay, and dead-letter strategy are present." },
    { label: "ALICE grounding exists", complete: results.every(result => result.aliceVisibilityScore >= 80), detail: "ALICE receives trace, event, outcome, and intelligence context." },
    { label: "Observability coverage exists", complete: results.every(result => result.observabilityScore >= 100), detail: "Tracing, metrics, logging, and alerting are enabled." },
    { label: "SLA coverage exists", complete: results.every(result => result.slaCoverageScore >= 100), detail: "Every workflow declares an SLA expectation." }
  ];
}
