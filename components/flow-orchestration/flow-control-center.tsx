import { AlertTriangle, CheckCircle2, Clock3, GitBranch, PauseCircle, RotateCcw, ShieldCheck, Workflow } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import type { FlowControlCenterRun, FlowControlCenterSnapshot, FlowHealth } from "@/lib/flow-orchestration/control-center";

export function FlowControlCenter({ snapshot }: { snapshot: FlowControlCenterSnapshot }) {
  const activeRuns = snapshot.runs.filter(run => !["succeeded", "failed", "cancelled"].includes(run.status));
  const terminalRuns = snapshot.runs.filter(run => ["succeeded", "failed", "cancelled"].includes(run.status));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="brand-kicker">Flow Orchestration Operating System</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Flow Control Center</h1>
          <p className="mt-2 max-w-3xl text-base font-semibold text-muted">
            Observe cross-workflow business processes, approvals, waits, retries, failures, SLA aging, and execution lineage without bypassing Workflow OS or Runtime OS.
          </p>
        </div>
        <div className="rounded border border-line bg-white px-4 py-3 text-sm font-semibold text-muted shadow-sm">
          <span className="font-black text-ink">Architecture:</span> Flow OS → Workflow OS → Runtime OS → Event Fabric
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Flows" value={snapshot.counts.active} detail={`${snapshot.counts.total} recent runs observed`} tone="teal" />
        <MetricCard label="Human Approvals" value={snapshot.counts.approvals} detail="Explicit governance gates waiting" tone="gold" />
        <MetricCard label="Retries Scheduled" value={snapshot.counts.retries} detail="Durable recovery candidates" tone="blue" />
        <MetricCard label="Critical Flows" value={snapshot.sla.critical} detail={`Aged ≥ ${snapshot.sla.criticalAfterMinutes}m or blocked`} tone="rust" />
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <StatusCard icon={<PauseCircle className="h-5 w-5" />} label="Waiting" value={snapshot.counts.waiting} detail="Event or approval waits" />
        <StatusCard icon={<ShieldCheck className="h-5 w-5" />} label="Blocked" value={snapshot.counts.blocked} detail="Needs operator intervention" />
        <StatusCard icon={<AlertTriangle className="h-5 w-5" />} label="Failed" value={snapshot.counts.failed} detail="Terminal failures" />
        <StatusCard icon={<CheckCircle2 className="h-5 w-5" />} label="Succeeded" value={snapshot.counts.succeeded} detail="Completed flow runs" />
      </section>

      <section className="rounded border border-line bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-line p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">Active orchestration</h2>
            <p className="mt-1 text-sm font-semibold text-muted">Business processes currently executing, waiting, retrying, or blocked.</p>
          </div>
          <div className="text-xs font-black uppercase tracking-wider text-muted">
            Attention ≥ {snapshot.sla.attentionAfterMinutes}m · Critical ≥ {snapshot.sla.criticalAfterMinutes}m
          </div>
        </div>
        <div className="divide-y divide-line">
          {activeRuns.length ? activeRuns.map(run => <RunRow key={run.id} run={run} />) : <EmptyState label="No active flow runs." />}
        </div>
      </section>

      <section className="rounded border border-line bg-white shadow-sm">
        <div className="border-b border-line p-5">
          <h2 className="text-xl font-black text-ink">Recent terminal runs</h2>
          <p className="mt-1 text-sm font-semibold text-muted">Completed, failed, or cancelled flow history with execution lineage.</p>
        </div>
        <div className="divide-y divide-line">
          {terminalRuns.length ? terminalRuns.slice(0, 20).map(run => <RunRow key={run.id} run={run} />) : <EmptyState label="No terminal flow runs yet." />}
        </div>
      </section>

      <footer className="rounded border border-line bg-paper p-4 text-sm font-semibold text-muted">
        Snapshot generated {formatDate(snapshot.generatedAt)}. Flow OS is observational and coordinative: workflow execution remains authoritative in Workflow OS, while runtime reliability remains authoritative in Runtime OS.
      </footer>
    </div>
  );
}

function RunRow({ run }: { run: FlowControlCenterRun }) {
  return (
    <details className="group p-5">
      <summary className="grid cursor-pointer list-none gap-4 md:grid-cols-[1.5fr_.8fr_.8fr_.7fr_.6fr] md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-ink">{humanize(run.flowKey)}</strong>
            <HealthBadge health={run.health} />
          </div>
          <p className="mt-1 text-xs font-semibold text-muted">{run.id}</p>
        </div>
        <DataPoint label="Current step" value={run.currentStepKey ? humanize(run.currentStepKey) : "Terminal"} />
        <DataPoint label="Status" value={humanize(run.status)} />
        <DataPoint label="Age" value={formatAge(run.ageMinutes)} />
        <div className="flex items-center justify-end gap-3 text-xs font-black text-muted">
          <span>{run.workflowExecutionCount} executions</span>
          <GitBranch className="h-4 w-4 transition group-open:rotate-90" />
        </div>
      </summary>

      <div className="mt-5 grid gap-4 border-t border-line pt-5 xl:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MiniMetric label="Steps" value={run.stepCount} />
            <MiniMetric label="Active waits" value={run.activeWaits} />
            <MiniMetric label="Approval waits" value={run.approvalWaits} />
            <MiniMetric label="Retries" value={run.retryCount} />
          </div>
          <div className="rounded border border-line bg-paper p-4 text-sm font-semibold text-muted">
            <p><strong className="text-ink">Organization:</strong> {run.organizationId}</p>
            <p className="mt-2"><strong className="text-ink">Correlation:</strong> {run.correlationId ?? "Not assigned"}</p>
            <p className="mt-2"><strong className="text-ink">Started:</strong> {formatDate(run.startedAt)}</p>
            <p className="mt-2"><strong className="text-ink">Updated:</strong> {formatDate(run.updatedAt)}</p>
            {run.lastError ? <p className="mt-2 font-bold text-rust"><strong>Last error:</strong> {run.lastError}</p> : null}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Workflow className="h-5 w-5 text-teal" />
            <h3 className="font-black text-ink">Execution lineage</h3>
          </div>
          <div className="space-y-2">
            {run.lineage.length ? run.lineage.map((step, index) => (
              <div key={`${step.stepKey}-${step.attempt}`} className="grid gap-3 rounded border border-line bg-white p-3 md:grid-cols-[2rem_1.2fr_.7fr_1fr] md:items-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-paper text-xs font-black text-muted">{index + 1}</div>
                <div>
                  <strong className="text-sm text-ink">{humanize(step.stepKey)}</strong>
                  <p className="text-xs font-semibold text-muted">Attempt {step.attempt}</p>
                </div>
                <span className="text-xs font-black uppercase tracking-wide text-muted">{humanize(step.status)}</span>
                <div className="text-xs font-semibold text-muted">
                  {step.workflowExecutionId ? <p>Workflow: {shortId(step.workflowExecutionId)}</p> : <p>Coordinator step</p>}
                  {step.nextRetryAt ? <p className="mt-1"><RotateCcw className="mr-1 inline h-3 w-3" />Retry {formatDate(step.nextRetryAt)}</p> : null}
                  {step.lastError ? <p className="mt-1 font-bold text-rust">{step.lastError}</p> : null}
                </div>
              </div>
            )) : <EmptyState label="No step lineage persisted yet." />}
          </div>
        </div>
      </div>
    </details>
  );
}

function StatusCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: number; detail: string }) {
  return (
    <article className="rounded border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-teal">{icon}<span className="text-xs font-black uppercase tracking-wider text-muted">{label}</span></div>
      <strong className="mt-3 block text-2xl font-black text-ink">{value}</strong>
      <p className="mt-1 text-xs font-semibold text-muted">{detail}</p>
    </article>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] font-black uppercase tracking-wider text-muted">{label}</p><p className="mt-1 text-sm font-bold text-ink">{value}</p></div>;
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded bg-paper px-3 py-3"><p className="text-[11px] font-black uppercase tracking-wider text-muted">{label}</p><strong className="mt-1 block text-lg text-ink">{value}</strong></div>;
}

function HealthBadge({ health }: { health: FlowHealth }) {
  const className = health === "critical" ? "bg-rust/10 text-rust" : health === "attention" ? "bg-gold/15 text-ink" : "bg-green/10 text-green";
  return <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider ${className}`}>{health}</span>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="p-6 text-sm font-semibold text-muted"><Clock3 className="mr-2 inline h-4 w-4" />{label}</div>;
}

function humanize(value: string) {
  return value.replace(/_v\d+$/i, "").replace(/[_-]+/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function shortId(value: string) {
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

function formatAge(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
