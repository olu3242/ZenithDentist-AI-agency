import { AliceRuntimeRecommendations } from "@/components/mission-control/alice-runtime-recommendations";
import { DeadLetterExplorer } from "@/components/mission-control/dead-letter-explorer";
import { DependencyIssuePanel } from "@/components/mission-control/dependency-issue-panel";
import { OperationalGraphPanel } from "@/components/mission-control/operational-graph-panel";
import { PredictiveAlertFeed } from "@/components/mission-control/predictive-alert-feed";
import { RuntimeHealthDashboard } from "@/components/mission-control/runtime-health-dashboard";
import { RuntimeTraceViewer } from "@/components/mission-control/runtime-trace-viewer";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { detectDependencyIssuesFromRuntime } from "@/lib/runtime/dependency-intelligence";
import { buildWorkflowGraphFromRuntime } from "@/lib/runtime/operational-graph";
import { generatePredictiveOperationalAlertsFromRuntime } from "@/lib/runtime/predictive-monitoring";

export default async function MissionControlPage() {
  const state = await getRuntimeHealthState();
  const graph = buildWorkflowGraphFromRuntime(state);
  const dependencyIssues = detectDependencyIssuesFromRuntime(state);
  const predictiveAlerts = generatePredictiveOperationalAlertsFromRuntime(state);
  return (
    <main className="min-h-screen bg-paper p-5 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-xs font-black uppercase tracking-wider text-teal">Zenith Automation Platform</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Mission Control</h1>
          <p className="mt-2 max-w-3xl text-base font-semibold text-muted">Live operations, queue visibility, active workflows, retries, provider health, and event orchestration.</p>
        </header>
        <RuntimeHealthDashboard state={state} />
        <OperationalGraphPanel graph={graph} />
        <AliceRuntimeRecommendations state={state} />
        <div className="grid gap-6 xl:grid-cols-2">
          <PredictiveAlertFeed alerts={predictiveAlerts} />
          <DependencyIssuePanel issues={dependencyIssues} />
        </div>
        <DeadLetterExplorer state={state} />
        <RuntimeTraceViewer state={state} />
      </div>
    </main>
  );
}
