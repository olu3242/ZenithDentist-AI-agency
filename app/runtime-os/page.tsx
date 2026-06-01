import { AppShell } from "@/components/app/app-shell";
import { RuntimeHealthDashboard } from "@/components/mission-control/runtime-health-dashboard";
import { RuntimeTraceViewer } from "@/components/mission-control/runtime-trace-viewer";
import { MetricCard } from "@/components/metric-card";
import { getTenantData } from "@/lib/data/tenants";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getCurrentZenithRole } from "@/lib/server-auth";

export default async function RuntimeOSPage() {
  const [tenantData, role, runtime] = await Promise.all([
    getTenantData(),
    getCurrentZenithRole("super_admin"),
    getRuntimeHealthState()
  ]);

  return (
    <AppShell role={role} organization={tenantData.organization} locations={tenantData.locations}>
      <div className="space-y-6">
        <header>
          <p className="text-xs font-black uppercase tracking-wider text-teal">Zenith Runtime OS</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Runtime OS</h1>
          <p className="mt-2 max-w-3xl text-base font-semibold text-muted">
            Automation health, trace execution, provider pressure, dead letters, and recovery readiness.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Operational score" value={`${runtime.scores.operationalScore}%`} detail="Runtime score" tone="green" />
          <MetricCard label="Healing score" value={`${runtime.scores.healingScore}%`} detail="Self-healing posture" tone="teal" />
          <MetricCard label="Traces" value={runtime.traces.length} detail="Execution records" tone="blue" />
          <MetricCard label="Dead letters" value={runtime.deadLetters.length} detail="Manual review queue" tone="rust" />
        </div>
        <RuntimeHealthDashboard state={runtime} />
        <RuntimeTraceViewer state={runtime} />
      </div>
    </AppShell>
  );
}
