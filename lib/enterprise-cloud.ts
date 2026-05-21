import { getAutonomousEngineState, runOperationalSimulation } from "@/lib/autonomous";
import { getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";
import type { Database, IntegrationStatus, PMSProviderKey, CloudLayerKey, AliceOperationalMode } from "@/lib/database.types";
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
  const seeded = seededEnterpriseCloudData(orgId);

  if (!supabase) return assembleEnterpriseState(seeded);

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
    integrations: integrations.data?.length ? integrations.data : seeded.integrations,
    layers: layers.data?.length ? layers.data : seeded.layers,
    revenueRuns: revenueRuns.data?.length ? revenueRuns.data : seeded.revenueRuns,
    graph: {
      nodes: nodes.data?.length ? nodes.data : seeded.graph.nodes,
      edges: edges.data?.length ? edges.data : seeded.graph.edges
    },
    forecasts: forecasts.data?.length ? forecasts.data : seeded.forecasts,
    playbooks: playbooks.data?.length ? playbooks.data : seeded.playbooks,
    simulations: simulations.data?.length ? simulations.data : seeded.simulations,
    governance: governance.data?.length ? governance.data : seeded.governance
  };

  const health = calculatePracticeHealth(portalData.metrics, portalData.automationEvents, tenantData.benchmarks[0]);
  return assembleEnterpriseState(data, health.overall);
}

export async function getRevenueOrchestrationState() {
  const [cloud, autonomous] = await Promise.all([getEnterpriseCloudState(), getAutonomousEngineState()]);
  const latestRun = cloud.revenueRuns[0];
  return {
    latestRun,
    prioritizedRecoveries: [
      { label: "High-value recall", value: "$18.4K", priority: "critical", confidence: 0.88 },
      { label: "Chair utilization", value: "$11.7K", priority: "high", confidence: 0.84 },
      { label: "Hygiene retention", value: "$9.2K", priority: "high", confidence: 0.81 }
    ],
    autonomousConfidence: autonomous.confidence,
    bottlenecks: latestRun?.bottlenecks ?? [],
    recommendations: latestRun?.recommendations ?? []
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

function assembleEnterpriseState(data: EnterpriseCloudData, healthScore = 86): EnterpriseCloudState {
  const layerAverage = Math.round(data.layers.reduce((sum, layer) => sum + layer.coordination_score, 0) / Math.max(1, data.layers.length));
  const revenueOpportunity = Math.round(data.revenueRuns[0]?.recovery_prioritized ?? 38400);
  const riskProbability = Math.round(Math.max(...data.forecasts.map(forecast => forecast.probability), 0.42) * 100);
  return {
    ...data,
    enterpriseScore: Math.round((healthScore + layerAverage) / 2),
    revenueOpportunity,
    riskProbability,
    confidenceMatrix: [
      { label: "Revenue orchestration", reliability: 91, certainty: 87, lift: "+$38.4K" },
      { label: "Forecasting", reliability: 86, certainty: 82, lift: "12-week horizon" },
      { label: "Benchmark intelligence", reliability: 89, certainty: 84, lift: "74th percentile" },
      { label: "Governance", reliability: 94, certainty: 91, lift: "Approval-safe" }
    ],
    providerCoverage: getSupportedPMSProviders().map(provider => ({
      ...provider,
      configured: data.integrations.some(integration => integration.provider === provider.provider)
    }))
  };
}

function seededEnterpriseCloudData(organizationId: string): EnterpriseCloudData {
  const now = new Date().toISOString();
  const integrations: PMSIntegration[] = [
    integration("pms-dentrix", organizationId, "loc-austin", "dentrix", "syncing", "Austin Dentrix Core", 94),
    integration("pms-open-dental", organizationId, "loc-round-rock", "open_dental", "configured", "Round Rock Open Dental", 91),
    integration("pms-eaglesoft", organizationId, "loc-cedar-park", "eaglesoft", "degraded", "Cedar Park Eaglesoft", 76)
  ];
  const layers: HealthcareCloudLayer[] = [
    layer(organizationId, "operational_intelligence", "syncing", 0.91, 93, 90),
    layer(organizationId, "revenue_orchestration", "syncing", 0.88, 89, 92),
    layer(organizationId, "patient_engagement", "configured", 0.84, 87, 86),
    layer(organizationId, "benchmark_intelligence", "configured", 0.89, 90, 88),
    layer(organizationId, "autonomous_optimization", "configured", 0.86, 86, 91),
    layer(organizationId, "enterprise_governance", "configured", 0.93, 92, 94)
  ];
  const revenueRuns: RevenueOrchestrationRun[] = [{
    id: "run-current",
    organization_id: organizationId,
    run_at: now,
    leakage_detected: 62400,
    recovery_prioritized: 38400,
    chair_utilization: 83,
    hygiene_retention: 78,
    bottlenecks: ["Wednesday provider overload", "Cedar Park sync degradation", "180-day recall drop-off"],
    recommendations: ["Protect high-value recall blocks", "Rebalance provider scheduling", "Prioritize hygiene retention outreach"],
    confidence: 0.88
  }];
  const nodes: KnowledgeGraphNode[] = [
    graphNode("node-scheduling", organizationId, "behavior", "Afternoon scheduling instability", 0.87),
    graphNode("node-staffing", organizationId, "capacity", "Provider load imbalance", 0.82),
    graphNode("node-recall", organizationId, "retention", "180-day recall recovery", 0.9),
    graphNode("node-revenue", organizationId, "outcome", "Revenue recovery lift", 0.91)
  ];
  const edges: KnowledgeGraphEdge[] = [
    graphEdge("edge-1", organizationId, nodes[0].id, nodes[3].id, "reduces", 0.74),
    graphEdge("edge-2", organizationId, nodes[1].id, nodes[0].id, "amplifies", 0.68),
    graphEdge("edge-3", organizationId, nodes[2].id, nodes[3].id, "increases", 0.81)
  ];
  const forecasts: EnterpriseForecast[] = [
    forecast("forecast-staffing", organizationId, "staffing_shortage", 0.62, "Provider overload risk rises in 14 days", ["hygiene demand", "chair clustering"]),
    forecast("forecast-retention", organizationId, "retention_volatility", 0.48, "Recall volatility likely without cadence adjustment", ["180-day segment growth", "late confirmations"]),
    forecast("forecast-production", organizationId, "production_trajectory", 0.74, "Production trajectory improves if recovery queue is approved", ["chair utilization", "recall priority"])
  ];
  const playbooks: EnterprisePlaybook[] = [
    enterprisePlaybook("ent-no-show", organizationId, "Enterprise No-show Recovery", "schedule_stability"),
    enterprisePlaybook("ent-retention", organizationId, "Retention Optimization", "patient_retention"),
    enterprisePlaybook("ent-staffing", organizationId, "Staffing Stabilization", "capacity")
  ];
  const simulations: EnterpriseSimulation[] = [{
    id: "enterprise-sim-current",
    organization_id: organizationId,
    scenario_name: "Three-location retention acceleration",
    scenario_inputs: { locationCount: 3, recallCadenceDelta: 3, staffingDelta: 1 },
    projected_enterprise_impact: { revenue: 42800, benchmarkMovement: "+5 percentile points" },
    staffing_pressure: 61,
    retention_trajectory: 12.4,
    operational_resilience: 88,
    revenue_recovery_projection: 42800,
    benchmark_movement: { recall: "+5", retention: "+4" },
    confidence: 0.84,
    created_at: now
  }];
  const governance: GovernanceRecord[] = [
    governanceRecord("gov-retention", organizationId, "enterprise_playbook", "review_required", "Retention escalation requires owner review."),
    governanceRecord("gov-schedule", organizationId, "optimization", "approved", "Schedule stabilization approved with rollback plan.")
  ];

  return { integrations, layers, revenueRuns, graph: { nodes, edges }, forecasts, playbooks, simulations, governance };
}

function integration(id: string, organizationId: string, locationId: string, provider: PMSProviderKey, status: IntegrationStatus, displayName: string, health: number): PMSIntegration {
  const now = new Date().toISOString();
  return {
    id,
    organization_id: organizationId,
    location_id: locationId,
    provider,
    status,
    display_name: displayName,
    sync_cursor: "cursor-demo",
    last_sync_at: now,
    last_success_at: status === "degraded" ? new Date(Date.now() - 1000 * 60 * 48).toISOString() : now,
    failover_provider: provider === "eaglesoft" ? "carestream" : null,
    configuration: { syncTypes: ["appointments", "recalls", "production", "retention"] },
    health_score: health,
    created_at: now,
    updated_at: now
  };
}

function layer(organizationId: string, key: CloudLayerKey, status: IntegrationStatus, confidence: number, throughput: number, coordination: number): HealthcareCloudLayer {
  return {
    id: `layer-${key}`,
    organization_id: organizationId,
    layer_key: key,
    status,
    confidence,
    throughput_score: throughput,
    coordination_score: coordination,
    metadata: {},
    updated_at: new Date().toISOString()
  };
}

function graphNode(id: string, organizationId: string, nodeType: string, label: string, confidence: number): KnowledgeGraphNode {
  return { id, organization_id: organizationId, node_type: nodeType, label, properties: {}, confidence, created_at: new Date().toISOString() };
}

function graphEdge(id: string, organizationId: string, source: string, target: string, relationship: string, weight: number): KnowledgeGraphEdge {
  return { id, organization_id: organizationId, source_node_id: source, target_node_id: target, relationship_type: relationship, weight, evidence: {}, created_at: new Date().toISOString() };
}

function forecast(id: string, organizationId: string, type: string, probability: number, impact: string, drivers: string[]): EnterpriseForecast {
  return {
    id,
    organization_id: organizationId,
    location_id: null,
    forecast_type: type,
    forecast_window: "12 weeks",
    probability,
    projected_impact: { summary: impact },
    drivers,
    recommended_response: ["Review with ALICE", "Queue governance-safe optimization", "Measure outcome movement"],
    confidence: Math.min(0.92, probability + 0.18),
    generated_at: new Date().toISOString()
  };
}

function enterprisePlaybook(id: string, organizationId: string, name: string, category: string): EnterprisePlaybook {
  return {
    id,
    organization_id: organizationId,
    name,
    category,
    trigger_logic: { threshold: "risk score above 60", cadence: "daily review" },
    escalation_paths: ["Practice manager", "Executive owner"],
    optimization_recommendations: ["Prioritize highest revenue recovery segment", "Track outcome movement for two cycles"],
    rollback_logic: { restoreBaseline: true, reviewWindow: "7 days" },
    generated_adaptations: ["Adjust by location performance", "Protect provider capacity"],
    outcome_tracking: { primary: "revenue recovery", secondary: "retention lift" },
    status: "active",
    created_at: new Date().toISOString()
  };
}

function governanceRecord(id: string, organizationId: string, type: string, status: GovernanceRecord["status"], notes: string): GovernanceRecord {
  return {
    id,
    organization_id: organizationId,
    governed_object_type: type,
    governed_object_id: null,
    status,
    approval_chain: ["Practice manager", "Executive owner"],
    risk_controls: ["Human review", "Rollback plan", "Outcome audit"],
    rollback_plan: { restorePreviousCadence: true, auditWindow: "14 days" },
    audit_notes: notes,
    created_at: new Date().toISOString(),
    decided_at: status === "approved" ? new Date().toISOString() : null
  };
}
