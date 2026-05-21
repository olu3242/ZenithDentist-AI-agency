import { ALICECopilot } from "@/components/mission-control/alice-copilot";
import { DependencyIssuePanel } from "@/components/mission-control/dependency-issue-panel";
import { DentalIntelligencePanel } from "@/components/mission-control/dental-intelligence-panel";
import { ExecutiveReportCard } from "@/components/mission-control/executive-report-card";
import { IncidentTimeline } from "@/components/mission-control/incident-timeline";
import { OperationalGraph } from "@/components/mission-control/operational-graph";
import { OperationalMemoryPanel } from "@/components/mission-control/operational-memory-panel";
import { PredictiveAlertFeed } from "@/components/mission-control/predictive-alert-feed";
import { ProviderHealthPanel } from "@/components/mission-control/provider-health-panel";
import { ReplayCenter } from "@/components/mission-control/replay-center";
import { RuntimeHealthDashboard } from "@/components/mission-control/runtime-health-dashboard";
import { RuntimeHealthBar } from "@/components/mission-control/runtime-health-bar";
import { RuntimeHeatmap } from "@/components/mission-control/runtime-heatmap";
import { RuntimeTraceViewer } from "@/components/mission-control/runtime-trace-viewer";
import { generateOperationalInsights } from "@/lib/alice/operational-intelligence";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { detectDependencyIssuesFromRuntime } from "@/lib/runtime/dependency-intelligence";
import { generateDentalOperationalPredictions } from "@/lib/runtime/dental-intelligence";
import { buildExecutiveReportSnapshot } from "@/lib/runtime/executive-reporting";
import { getRuntimeIncidents } from "@/lib/runtime/incident-management";
import { getOperationalMemoryState } from "@/lib/runtime/operational-memory";
import { buildWorkflowGraphFromRuntime } from "@/lib/runtime/operational-graph";
import { generatePredictiveOperationalAlertsFromRuntime } from "@/lib/runtime/predictive-monitoring";
import { getProviderHealth } from "@/lib/runtime/provider-health";
import { buildReplayCenterState } from "@/lib/runtime/replay-engine";

export default async function MissionControlPage() {
  const [state, providers, incidents, memory, report, dentalPredictions, aliceInsights] = await Promise.all([
    getRuntimeHealthState(),
    getProviderHealth(),
    getRuntimeIncidents(),
    getOperationalMemoryState(),
    buildExecutiveReportSnapshot(),
    generateDentalOperationalPredictions(),
    generateOperationalInsights()
  ]);
  const graph = buildWorkflowGraphFromRuntime(state);
  const dependencyIssues = detectDependencyIssuesFromRuntime(state);
  const predictiveAlerts = generatePredictiveOperationalAlertsFromRuntime(state);
  const replay = buildReplayCenterState(state);
  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto grid max-w-[1600px] gap-5 p-5 lg:grid-cols-[230px_1fr_360px] lg:p-8">
        <aside className="hidden rounded border border-line bg-white p-4 shadow-sm lg:block">
          <p className="text-xs font-black uppercase tracking-wider text-teal">Intelligence sidebar</p>
          <nav className="mt-5 grid gap-2 text-sm font-black text-muted">
            {["Runtime graph", "Predictive monitoring", "Trace explorer", "Replay center", "Incidents", "Operational memory"].map(item => (
              <span key={item} className="rounded bg-paper px-3 py-2">{item}</span>
            ))}
          </nav>
        </aside>
        <section className="min-w-0 space-y-6">
          <header className="rounded border border-line bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-teal">Zenith Automation Platform</p>
            <h1 className="mt-2 text-4xl font-black text-ink">Mission Control</h1>
            <p className="mt-2 max-w-4xl text-base font-semibold text-muted">Enterprise operational command center for runtime intelligence, provider confidence, trace propagation, replay safety, and predictive monitoring.</p>
          </header>
          <RuntimeHealthBar state={state} providers={providers} replay={replay} />
          <OperationalGraph graph={graph} />
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
          <DentalIntelligencePanel predictions={dentalPredictions} />
        </section>
        <aside className="space-y-6">
          <ALICECopilot insights={aliceInsights} alerts={predictiveAlerts} />
          <RuntimeHealthDashboard state={state} />
          <OperationalMemoryPanel memory={memory} />
          <ExecutiveReportCard report={report} />
        </aside>
      </div>
    </main>
  );
}
