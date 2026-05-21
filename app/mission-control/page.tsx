import { AliceRuntimeRecommendations } from "@/components/mission-control/alice-runtime-recommendations";
import { DeadLetterExplorer } from "@/components/mission-control/dead-letter-explorer";
import { RuntimeHealthDashboard } from "@/components/mission-control/runtime-health-dashboard";
import { RuntimeTraceViewer } from "@/components/mission-control/runtime-trace-viewer";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";

export default async function MissionControlPage() {
  const state = await getRuntimeHealthState();
  return (
    <main className="min-h-screen bg-paper p-5 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-xs font-black uppercase tracking-wider text-teal">Zenith Automation Platform</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Mission Control</h1>
          <p className="mt-2 max-w-3xl text-base font-semibold text-muted">Live operations, queue visibility, active workflows, retries, provider health, and event orchestration.</p>
        </header>
        <RuntimeHealthDashboard state={state} />
        <AliceRuntimeRecommendations state={state} />
        <DeadLetterExplorer state={state} />
        <RuntimeTraceViewer state={state} />
      </div>
    </main>
  );
}
