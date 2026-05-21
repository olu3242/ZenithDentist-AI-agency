import { getAutonomousEngineState, runOperationalSimulation } from "@/lib/autonomous";
import { getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";
import type { Database, PMSProviderKey, AliceOperationalMode, Json } from "@/lib/database.types";
import { calculatePracticeHealth } from "@/lib/health";
import { getSupportedPMSProviders } from "@/lib/pms";
import { createServiceClient } from "@/lib/supabase/server";

export type PMSIntegration = Database["public"]["Tables"]["pms_integrations"]["Row"];
export type HealthcareCloudLayer = Database["public"]["Tables"]["healthcare_cloud_layers"]["Row"];
export type RevenueOrchestrationRun = Database["public"]["Tables"]["revenue_orchestration_runs"]["Row"];
export type KnowledgeGraphNode = Database["public"]["Tables"]["knowledge_graph_nodes"]["Row"];
export type KnowledgeGraphEdge = Database["public"]["Tables"]["knowledge_graph_edges"]["Row"];
export type EnterpriseForecast = Database["public"]["Tables"]["enterprise_forecasts"]["Row"];
export type EnterprisePlaybook = Database["public"]["Tables"]["enterprise_playbooks"]["Row"];
export type EnterpriseSimulation = Database["public"]["Tables"]["enterprise_simulations"]["Row"];
export type GovernanceRecord = Database["public"]["Tables"]["ai_governance_records"]["Row"];

export interface EnterpriseCloudData {
  integrations: PMSIntegration[];
  layers: HealthcareCloudLayer[];
  revenueRuns: RevenueOrchestrationRun[];
  graph: { nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] };
  forecasts: EnterpriseForecast[];
  playbooks: EnterprisePlaybook[];
  simulations: EnterpriseSimulation[];
  governance: GovernanceRecord[];
}

export interface EnterpriseCloudState extends EnterpriseCloudData {
  enterpriseScore: number;
  revenueOpportunity: number;
  riskProbability: number;
  confidenceMatrix: Array<{ label: string; reliability: number; certainty: number; lift: string }>;
  providerCoverage: Array<{ provider: PMSProviderKey; displayName: string; configured: boolean }>;
}

export async function getEnterpriseCloudState(): Promise<EnterpriseCloudState> {
  const [tenantData, portalData] = await Promise.all([getTenantData(), getPortalData()]);
  const supabase = createServiceClient();
  const orgId = tenantData.tenant.organizationId ?? tenantData.organization.id;

  if (!supabase) return assembleEnterpriseState(emptyEnterpriseCloudData());

  const [integrations, layers, revenueRuns, nodes, edges, forecasts, playbooks, simulations, governance] = await Promise.all([
    supabase.from("pms_integrations").select("*").eq("organization_id", orgId).order("updated_at", { ascending: false }),
    supabase.from("healthcare_cloud_layers").select("*").eq("organization_id", orgId).order("layer_key"),
    supabase.from("revenue_orchestration_runs").select("*").eq("organization_id", orgId).order("run_at", { ascending: false }).limit(12),
    supabase.from("knowledge_graph_nodes").select("*").or(`organization_id.eq.${orgId},organization_id.is.null`).limit(60),
    supabase.from("knowledge_graph_edges").select("*").or(`organization_id.eq.${orgId},organization_id.is.null`).limit(100),
    supabase.from("enterprise_forecasts").select("*").eq("organization_id", orgId).order("generated_at", { ascending: false }).limit(20),
    supabase.from("enterprise_playbooks").select("*").or(`organization_id.eq.${orgId},organization_id.is.null`).order("created_at", { ascending: false }).limit(20),
    supabase.from("enterprise_simulations").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(12),
    supabase.from("ai_governance_records").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(30)
  ]);

  const data: EnterpriseCloudData = {
    integrations: integrations.data ?? [],
    layers: layers.data ?? [],
    revenueRuns: revenueRuns.data ?? [],
    graph: {
      nodes: nodes.data ?? [],
      edges: edges.data ?? []
    },
    forecasts: forecasts.data ?? [],
    playbooks: playbooks.data ?? [],
    simulations: simulations.data ?? [],
    governance: governance.data ?? []
  };

  const health = calculatePracticeHealth(portalData.metrics, portalData.automationEvents, tenantData.benchmarks[0]);
  return assembleEnterpriseState(data, health.overall);
}

export async function getRevenueOrchestrationState() {
  const [cloud, autonomous] = await Promise.all([getEnterpriseCloudState(), getAutonomousEngineState()]);
  const latestRun = cloud.revenueRuns[0];
  const recommendations = toStringArray(latestRun?.recommendations);
  const bottlenecks = toStringArray(latestRun?.bottlenecks);
  return {
    latestRun,
    prioritizedRecoveries: latestRun
      ? recommendations.map((recommendation, index) => ({
          label: recommendation,
          value: index === 0 ? `$${Math.round(latestRun.recovery_prioritized).toLocaleString()}` : "Measured in live run",
          priority: index === 0 ? "critical" : "high",
          confidence: latestRun.confidence
        }))
      : [],
    autonomousConfidence: autonomous.confidence,
    bottlenecks,
    recommendations
  };
}

export async function runEnterpriseSimulation(input: Record<string, number>) {
  const baseline = await runOperationalSimulation({
    reminderTimingDelta: input.reminderTimingDelta,
    recallCadenceDelta: input.recallCadenceDelta,
    staffingDelta: input.staffingDelta,
    reviewTimingDelta: input.reviewTimingDelta
  });
  const enterpriseScale = Math.max(1, Number(input.locationCount ?? 3));
  return {
    projectedEnterpriseImpact: Math.round(baseline.projectedRevenueImpact * enterpriseScale * 1.18),
    staffingPressure: Math.max(0, Math.round((baseline.projectedStaffingLoad - Number(input.staffingDelta ?? 0) * 2) * 10) / 10),
    retentionTrajectory: Math.round((baseline.projectedRetentionChange + Number(input.retentionCampaignLift ?? 2)) * 10) / 10,
    operationalResilience: Math.min(99, Math.round((baseline.projectedEfficiency + 18) * 10) / 10),
    revenueRecoveryProjection: Math.round(baseline.projectedRevenueImpact * enterpriseScale * 1.18),
    benchmarkMovement: { recall: "+6 percentile points", noShow: "+4 percentile points", retention: "+5 percentile points" },
    confidence: Math.min(0.93, baseline.confidence + 0.04)
  };
}

export function buildAliceEnterpriseContext(mode: AliceOperationalMode = "executive_intelligence") {
  return {
    mode,
    grounding: [
      "operational metrics",
      "enterprise intelligence",
      "benchmark snapshots",
      "historical recommendations",
      "forecasting outcomes",
      "optimization effectiveness",
      "operational event history"
    ],
    responseFramework: ["Observation", "Operational interpretation", "Revenue/business impact", "Recommendation", "Expected outcome"]
  };
}

function assembleEnterpriseState(data: EnterpriseCloudData, healthScore = 0): EnterpriseCloudState {
  const layerAverage = data.layers.length
    ? Math.round(data.layers.reduce((sum, layer) => sum + layer.coordination_score, 0) / data.layers.length)
    : 0;
  const revenueOpportunity = Math.round(data.revenueRuns[0]?.recovery_prioritized ?? 0);
  const highestForecastRisk = data.forecasts.length ? Math.max(...data.forecasts.map(forecast => forecast.probability)) : 0;
  const riskProbability = Math.round(highestForecastRisk * 100);
  const latestRevenueRun = data.revenueRuns[0];
  const forecastConfidence = data.forecasts.length
    ? Math.round(data.forecasts.reduce((sum, forecast) => sum + forecast.confidence, 0) / data.forecasts.length * 100)
    : 0;
  const governanceConfidence = data.governance.length
    ? Math.round(data.governance.filter(record => record.status === "approved").length / data.governance.length * 100)
    : 0;
  return {
    ...data,
    enterpriseScore: Math.round((healthScore + layerAverage) / 2),
    revenueOpportunity,
    riskProbability,
    confidenceMatrix: [
      {
        label: "Revenue recovery",
        reliability: latestRevenueRun ? Math.round(latestRevenueRun.confidence * 100) : 0,
        certainty: latestRevenueRun ? Math.round(latestRevenueRun.confidence * 100) : 0,
        lift: latestRevenueRun ? `$${Math.round(latestRevenueRun.recovery_prioritized).toLocaleString()}` : "No live runs"
      },
      {
        label: "Forecasting",
        reliability: forecastConfidence,
        certainty: forecastConfidence,
        lift: data.forecasts[0]?.forecast_window ?? "No live forecasts"
      },
      {
        label: "Benchmark intelligence",
        reliability: healthScore,
        certainty: healthScore,
        lift: data.layers.length ? `${layerAverage}% layer coordination` : "No live benchmarks"
      },
      {
        label: "Governance",
        reliability: governanceConfidence,
        certainty: governanceConfidence,
        lift: data.governance.length ? `${data.governance.length} governance records` : "No live records"
      }
    ],
    providerCoverage: getSupportedPMSProviders().map(provider => ({
      ...provider,
      configured: data.integrations.some(integration => integration.provider === provider.provider)
    }))
  };
}

function emptyEnterpriseCloudData(): EnterpriseCloudData {
  return {
    integrations: [],
    layers: [],
    revenueRuns: [],
    graph: { nodes: [], edges: [] },
    forecasts: [],
    playbooks: [],
    simulations: [],
    governance: []
  };
}

function toStringArray(value: Json | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
