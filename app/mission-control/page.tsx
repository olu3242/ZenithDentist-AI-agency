import { ALICECopilot } from "@/components/mission-control/alice-copilot";
import { AgentCommunicationBus } from "@/components/mission-control/agent-communication-bus";
import { AuditTimeline } from "@/components/mission-control/audit-timeline";
import { AutonomousRecoveryCenter } from "@/components/mission-control/autonomous-recovery-center";
import { DependencyIssuePanel } from "@/components/mission-control/dependency-issue-panel";
import { DentalIntelligencePanel } from "@/components/mission-control/dental-intelligence-panel";
import { ExecutiveKPIGrid } from "@/components/mission-control/executive-kpi-grid";
import { ExecutiveIntelligenceCloud } from "@/components/mission-control/executive-intelligence-cloud";
import { ExecutiveReportCard } from "@/components/mission-control/executive-report-card";
import { EnterpriseUsageDashboard } from "@/components/mission-control/enterprise-usage-dashboard";
import { GovernanceCenter } from "@/components/mission-control/governance-center";
import { IncidentTimeline } from "@/components/mission-control/incident-timeline";
import { InfrastructureAwarenessPanel } from "@/components/mission-control/infrastructure-awareness-panel";
import { OperationalAgentGrid } from "@/components/mission-control/operational-agent-grid";
import { OperationalMarketplace } from "@/components/mission-control/operational-marketplace";
import { OperationalGraph } from "@/components/mission-control/operational-graph";
import { OperationalForecastPanel } from "@/components/mission-control/operational-forecast-panel";
import { OperationalMemoryPanel } from "@/components/mission-control/operational-memory-panel";
import { OperationalRecoveryOrchestrator } from "@/components/mission-control/operational-recovery-orchestrator";
import { OperationalSDKExplorer } from "@/components/mission-control/operational-sdk-explorer";
import { PlatformizationPanel } from "@/components/mission-control/platformization-panel";
import { PredictiveAlertFeed } from "@/components/mission-control/predictive-alert-feed";
import { ProviderHealthPanel } from "@/components/mission-control/provider-health-panel";
import { RealtimeRefresh } from "@/components/portal/realtime-refresh";
import { ReplayCenter } from "@/components/mission-control/replay-center";
import { RuntimeHealthDashboard } from "@/components/mission-control/runtime-health-dashboard";
import { RuntimeHealthBar } from "@/components/mission-control/runtime-health-bar";
import { RuntimeHeatmap } from "@/components/mission-control/runtime-heatmap";
import { RuntimeCognitionPanel } from "@/components/mission-control/runtime-cognition-panel";
import { RuntimeDigitalTwin } from "@/components/mission-control/runtime-digital-twin";
import { RuntimeEventFabric } from "@/components/mission-control/runtime-event-fabric";
import { RuntimeSwarmViewer } from "@/components/mission-control/runtime-swarm-viewer";
import { RuntimeTraceViewer } from "@/components/mission-control/runtime-trace-viewer";
import { SimulationLab } from "@/components/mission-control/simulation-lab";
import { TenantIntelligenceGrid } from "@/components/mission-control/tenant-intelligence-grid";
import { generateOperationalInsights } from "@/lib/alice/operational-intelligence";
import { getOperationalMeshState } from "@/lib/runtime/agent-mesh";
import { getAutonomousRecoveryState } from "@/lib/runtime/autonomous-recovery";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { detectDependencyIssuesFromRuntime } from "@/lib/runtime/dependency-intelligence";
import { generateDentalOperationalPredictions } from "@/lib/runtime/dental-intelligence";
import { buildExecutiveReportSnapshot } from "@/lib/runtime/executive-reporting";
import { getGovernanceState } from "@/lib/runtime/governance";
import { getRuntimeIncidents } from "@/lib/runtime/incident-management";
import { getRuntimeDigitalTwinState } from "@/lib/runtime/digital-twin";
import { getExecutiveIntelligenceCloudState, getInfrastructureAwarenessState } from "@/lib/runtime/operational-cloud";
import { getOperationalCognitionState } from "@/lib/runtime/operational-cognition";
import { getOperationalMemoryState } from "@/lib/runtime/operational-memory";
import { generateRuntimeForecasts } from "@/lib/runtime/operational-forecasting";
import { buildWorkflowGraphFromRuntime } from "@/lib/runtime/operational-graph";
import { generatePredictiveOperationalAlertsFromRuntime } from "@/lib/runtime/predictive-monitoring";
import { getProviderHealth } from "@/lib/runtime/provider-health";
import { getProductizationState } from "@/lib/platform/productization";
import { getRuntimeEventFabricState } from "@/lib/runtime/event-fabric";
import { getRecoveryOrchestratorState } from "@/lib/runtime/recovery-orchestrator";
import { buildReplayCenterState } from "@/lib/runtime/replay-engine";
import { buildSimulationCenterState } from "@/lib/runtime/simulation-engine";
import { getTenantIntelligenceState } from "@/lib/runtime/tenant-intelligence";

export default async function MissionControlPage() {
  const [state, providers, incidents, memory, report, dentalPredictions, aliceInsights, governance, recovery, forecasts, simulations, tenantIntelligence, mesh, cognition, twin, awareness, executiveCloud, fabric, orchestrator, productization] = await Promise.all([
    getRuntimeHealthState(),
    getProviderHealth(),
    getRuntimeIncidents(),
    getOperationalMemoryState(),
    buildExecutiveReportSnapshot(),
    generateDentalOperationalPredictions(),
    generateOperationalInsights(),
    getGovernanceState(),
    getAutonomousRecoveryState(),
    generateRuntimeForecasts(),
    buildSimulationCenterState(),
    getTenantIntelligenceState(),
    getOperationalMeshState(),
    getOperationalCognitionState(),
    getRuntimeDigitalTwinState(),
    getInfrastructureAwarenessState(),
    getExecutiveIntelligenceCloudState(),
    getRuntimeEventFabricState(),
    getRecoveryOrchestratorState(),
    getProductizationState()
  ]);
  const graph = buildWorkflowGraphFromRuntime(state);
  const dependencyIssues = detectDependencyIssuesFromRuntime(state);
  const predictiveAlerts = generatePredictiveOperationalAlertsFromRuntime(state);
  const replay = buildReplayCenterState(state);
  return (
    <main className="min-h-screen bg-background">
      <RealtimeRefresh />
      <div className="mx-auto grid max-w-[1600px] gap-5 p-5 lg:grid-cols-[230px_1fr_360px] lg:p-8">
        <aside className="hidden rounded border border-card bg-white p-4 shadow-sm lg:block">
          <p className="text-xs font-black uppercase tracking-wider text-accent">Intelligence sidebar</p>
          <nav className="mt-5 grid gap-2 text-sm font-black text-muted">
            {["Event fabric", "Executive cloud", "Platform core", "Marketplace", "Agent mesh", "Cognition", "Digital twin", "Governance", "Recovery", "SDK"].map(item => (
              <span key={item} className="rounded bg-background px-3 py-2">{item}</span>
            ))}
          </nav>
        </aside>
        <section className="min-w-0 space-y-6">
          <header className="rounded border border-card bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-accent">Zenith Automation Platform</p>
            <h1 className="mt-2 text-4xl font-black text-[#F8FAFC]">Mission Control</h1>
            <p className="mt-2 max-w-4xl text-base font-semibold text-muted">Enterprise operational command center for runtime intelligence, provider confidence, trace propagation, replay safety, and predictive monitoring.</p>
          </header>
          <RuntimeHealthBar state={state} providers={providers} replay={replay} />
          <ExecutiveKPIGrid runtime={state} replay={replay} tenant={tenantIntelligence} />
          <RuntimeEventFabric fabric={fabric} />
          <ExecutiveIntelligenceCloud cloud={executiveCloud} />
          <div className="grid gap-6 xl:grid-cols-2">
            <PlatformizationPanel state={productization} />
            <OperationalSDKExplorer state={productization} />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <OperationalMarketplace state={productization} />
            <EnterpriseUsageDashboard state={productization} />
          </div>
          <OperationalAgentGrid mesh={mesh} />
          <div className="grid gap-6 xl:grid-cols-2">
            <RuntimeCognitionPanel cognition={cognition} />
            <InfrastructureAwarenessPanel awareness={awareness} />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <RuntimeSwarmViewer mesh={mesh} />
            <AgentCommunicationBus mesh={mesh} />
          </div>
          <OperationalGraph graph={graph} />
          <RuntimeDigitalTwin twin={twin} />
          <div className="grid gap-6 xl:grid-cols-2">
            <GovernanceCenter governance={governance} />
            <OperationalRecoveryOrchestrator orchestrator={orchestrator} />
          </div>
          <AutonomousRecoveryCenter recovery={recovery} />
          <div className="grid gap-6 xl:grid-cols-2">
            <OperationalForecastPanel forecasts={forecasts} />
            <SimulationLab simulations={simulations} />
          </div>
          <RuntimeHeatmap state={state} />
          <div className="grid gap-6 xl:grid-cols-2">
            <PredictiveAlertFeed alerts={predictiveAlerts} />
            <DependencyIssuePanel issues={dependencyIssues} />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <RuntimeTraceViewer state={state} />
            <ReplayCenter replay={replay} />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <IncidentTimeline incidents={incidents} />
            <ProviderHealthPanel providers={providers} />
          </div>
          <TenantIntelligenceGrid tenant={tenantIntelligence} />
          <DentalIntelligencePanel predictions={dentalPredictions} />
        </section>
        <aside className="space-y-6">
          <ALICECopilot insights={aliceInsights} alerts={predictiveAlerts} />
          <AuditTimeline governance={governance} />
          <RuntimeHealthDashboard state={state} />
          <OperationalMemoryPanel memory={memory} />
          <ExecutiveReportCard report={report} />
        </aside>
      </div>
    </main>
  );
}
