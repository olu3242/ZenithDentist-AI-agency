import { AlertTriangle, Brain, CheckCircle2, Clock3, ExternalLink, GitBranch, PauseCircle, RotateCcw, ShieldCheck, TrendingUp, Workflow } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import type { FlowControlCenterRun, FlowControlCenterSnapshot, FlowHealth } from "@/lib/flow-orchestration/control-center";
import {
  approveFlowAction,
  cancelFlowAction,
  openWorkflowExecutionAction,
  rejectFlowAction,
  resumeFlowAction,
  retryFlowAction
} from "@/app/workflow-os/flows/actions";

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
            Observe, prioritize, and govern cross-workflow business processes with deterministic Flow Intelligence while execution remains controlled by Workflow OS and human governance.
          </p>
        </div>
        <div className="rounded border border-line bg-white px-4 py-3 text-sm font-semibold text-muted shadow-sm">
          <span className="font-black text-ink">Architecture:</span> Intelligence → Flow OS → Workflow OS → Runtime OS → Event Fabric
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Active Flows" value={snapshot.counts.active} detail={`${snapshot.counts.total} recent runs observed`} tone="teal" />
        <MetricCard label="Critical Priority" value={snapshot.intelligence.criticalPriority} detail={`${snapshot.intelligence.highPriority} additional high-priority`} tone="rust" />
        <MetricCard label="Revenue at Risk" value={`$${snapshot.intelligence.revenueAtRisk.toLocaleString()}`} detail="Estimated value represented in active flow context" tone="green" />
        <MetricCard label="Average SLA Risk" value={`${snapshot.intelligence.averageSlaRisk}%`} detail={`${snapshot.intelligence.anomalyCount} anomaly signals`} tone="gold" />
        <MetricCard label="Operator Actions" value={snapshot.counts.operatorActions} detail="Immutable governed action evidence" tone="blue" />
      </section>

      <section className="rounded border border-line bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Brain className="mt-1 h-5 w-5 text-teal" />
          <div>
            <h2 className="text-lg font-black text-ink">Flow Intelligence v1</h2>
            <p className="mt-1 text-sm font-semibold text-muted">
              Priority, SLA-risk, revenue-impact, anomaly, and next-action recommendations are deterministic and explainable. They do not execute actions automatically; every state-changing recommendation still requires an authorized operator decision.
            </p>
          </div>
        </div>
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
            <h2 className="text-xl font-black text-ink">Prioritized active orchestration</h2>
            <p className="mt-1 text-sm font-semibold text-muted">Active runs are ranked by Flow Intelligence priority score, then by age.</p>
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
          <p className="mt-1 text-sm font-semibold text-muted">Completed, failed, or cancelled flow history with intelligence, execution lineage, and operator evidence.</p>
        </div>
        <div className="divide-y divide-line">
          {terminalRuns.length ? terminalRuns.slice(0, 20).map(run => <RunRow key={run.id} run={run} />) : <EmptyState label="No terminal flow runs yet." />}
        </div>
      </section>

      <footer className="rounded border border-line bg-paper p-4 text-sm font-semibold text-muted">
        Snapshot generated {formatDate(snapshot.generatedAt)}. Flow Intelligence recommends; Flow OS coordinates; Workflow OS executes; Runtime OS owns reliability; authorized humans remain accountable for governed state changes.
      </footer>
    </div>
  );
}

function RunRow({ run }: { run: FlowControlCenterRun }) {
  return (
    <details className="group p-5">
      <summary className="grid cursor-pointer list-none gap-4 md:grid-cols-[1.4fr_.65fr_.75fr_.7fr_.65fr] md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-ink">{humanize(run.flowKey)}</strong>
            <HealthBadge health={run.health} />
            <PriorityBadge band={run.intelligence.priorityBand} score={run.intelligence.priorityScore} />
          </div>
          <p className="mt-1 text-xs font-semibold text-muted">{run.id}</p>
        </div>
        <DataPoint label="SLA risk" value={`${run.intelligence.slaRiskPercent}%`} />
        <DataPoint label="Value at risk" value={run.intelligence.revenueImpactEstimate > 0 ? `$${Math.round(run.intelligence.revenueImpactEstimate).toLocaleString()}` : "Not quantified"} />
        <DataPoint label="Current step" value={run.currentStepKey ? humanize(run.currentStepKey) : "Terminal"} />
        <div className="flex items-center justify-end gap-3 text-xs font-black text-muted">
          <span>{run.intelligence.anomalies.length} anomalies</span>
          <GitBranch className="h-4 w-4 transition group-open:rotate-90" />
        </div>
      </summary>

      <div className="mt-5 grid gap-4 border-t border-line pt-5 xl:grid-cols-[.9fr_1.1fr]">
        <div className="space-y-4">
          <FlowIntelligenceCard run={run} />
          <div className="grid grid-cols-2 gap-3">
            <MiniMetric label="Steps" value={run.stepCount} />
            <MiniMetric label="Active waits" value={run.activeWaits} />
            <MiniMetric label="Approval waits" value={run.approvalWaits} />
            <MiniMetric label="Retries" value={run.retryCount} />
          </div>
          <div className="rounded border border-line bg-paper p-4 text-sm font-semibold text-muted">
            <p><strong className="text-ink">Organization:</strong> {run.organizationId}</p>
            <p className="mt-2"><strong className="text-ink">Correlation:</strong> {run.correlationId ?? "Not assigned"}</p>
            <p className="mt-2"><strong className="text-ink">Status:</strong> {humanize(run.status)}</p>
            <p className="mt-2"><strong className="text-ink">Age:</strong> {formatAge(run.ageMinutes)}</p>
            <p className="mt-2"><strong className="text-ink">Started:</strong> {formatDate(run.startedAt)}</p>
            <p className="mt-2"><strong className="text-ink">Updated:</strong> {formatDate(run.updatedAt)}</p>
            {run.lastError ? <p className="mt-2 font-bold text-rust"><strong>Last error:</strong> {run.lastError}</p> : null}
          </div>
          <OperatorControls run={run} />
          <OperatorEvidence run={run} />
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
                  {step.workflowExecutionId ? (
                    <form action={openWorkflowExecutionAction}>
                      <input type="hidden" name="flowRunId" value={run.id} />
                      <input type="hidden" name="workflowExecutionId" value={step.workflowExecutionId} />
                      <button className="inline-flex items-center gap-1 font-black text-teal hover:underline" type="submit">
                        Workflow {shortId(step.workflowExecutionId)} <ExternalLink className="h-3 w-3" />
                      </button>
                    </form>
                  ) : <p>Coordinator step</p>}
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

function FlowIntelligenceCard({ run }: { run: FlowControlCenterRun }) {
  const intel = run.intelligence;
  return (
    <section className="rounded border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-teal" />
          <h3 className="text-sm font-black text-ink">ALICE flow recommendation</h3>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-muted">{intel.modelVersion} · {intel.confidence}% confidence</span>
      </div>
      <p className="mt-3 text-sm font-black text-ink">{intel.recommendation}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <MiniMetric label="Priority" value={intel.priorityScore} />
        <MiniMetric label="SLA Risk %" value={intel.slaRiskPercent} />
        <MiniMetric label="Anomaly Score" value={intel.anomalyScore} />
      </div>
      {intel.rationale.length ? (
        <ul className="mt-3 space-y-1 text-xs font-semibold text-muted">
          {intel.rationale.map(item => <li key={item}>• {item}</li>)}
        </ul>
      ) : null}
      {intel.anomalies.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {intel.anomalies.map(anomaly => <span key={anomaly} className="rounded-full bg-rust/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-rust">{humanize(anomaly)}</span>)}
        </div>
      ) : null}
      <div className="mt-3 flex items-center gap-2 rounded bg-paper px-3 py-2 text-xs font-semibold text-muted">
        <TrendingUp className="h-4 w-4 text-teal" />
        Recommended operator action: <strong className="text-ink">{humanize(intel.recommendedAction)}</strong>. Human approval remains required.
      </div>
    </section>
  );
}

function OperatorControls({ run }: { run: FlowControlCenterRun }) {
  const terminal = ["succeeded", "cancelled"].includes(run.status);
  const retryable = run.retryCount > 0 || run.failedSteps > 0 || ["failed", "blocked"].includes(run.status);
  const resumableEventWait = run.eventWaits > 0;

  if (terminal) return null;

  return (
    <section className="rounded border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-teal" />
        <h3 className="text-sm font-black text-ink">Operator actions</h3>
      </div>
      <p className="mt-1 text-xs font-semibold text-muted">Super-admin only. Recommendations never execute automatically; every action is tenant-checked and written to immutable operator evidence.</p>
      <div className="mt-3 grid gap-2">
        {run.approvalWaits > 0 ? <ActionForm flowRunId={run.id} action={approveFlowAction} label="Approve gate" tone="primary" placeholder="Approval rationale" /> : null}
        {run.approvalWaits > 0 ? <ActionForm flowRunId={run.id} action={rejectFlowAction} label="Reject gate" tone="danger" placeholder="Required rejection rationale" /> : null}
        {retryable ? <ActionForm flowRunId={run.id} action={retryFlowAction} label="Retry now" tone="secondary" placeholder="Retry reason" /> : null}
        {resumableEventWait ? <ActionForm flowRunId={run.id} action={resumeFlowAction} label="Resume event wait" tone="secondary" placeholder="Operator override rationale" /> : null}
        <ActionForm flowRunId={run.id} action={cancelFlowAction} label="Cancel flow" tone="danger" placeholder="Cancellation reason" />
      </div>
    </section>
  );
}

function ActionForm({ flowRunId, action, label, tone, placeholder }: {
  flowRunId: string;
  action: (formData: FormData) => Promise<void>;
  label: string;
  tone: "primary" | "secondary" | "danger";
  placeholder: string;
}) {
  const buttonClass = tone === "primary"
    ? "bg-teal text-white"
    : tone === "danger"
      ? "border border-rust/40 bg-rust/10 text-rust"
      : "border border-line bg-paper text-ink";
  return (
    <form action={action} className="grid gap-2 md:grid-cols-[1fr_auto]">
      <input type="hidden" name="flowRunId" value={flowRunId} />
      <input name="note" placeholder={placeholder} className="rounded border border-line bg-white px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-teal" />
      <button type="submit" className={`rounded px-3 py-2 text-xs font-black ${buttonClass}`}>{label}</button>
    </form>
  );
}

function OperatorEvidence({ run }: { run: FlowControlCenterRun }) {
  return (
    <section className="rounded border border-line bg-white p-4 shadow-sm">
      <h3 className="text-sm font-black text-ink">Operator evidence</h3>
      <p className="mt-1 text-xs font-semibold text-muted">{run.operatorActionCount} governed actions recorded for this flow.</p>
      <div className="mt-3 space-y-2">
        {run.recentOperatorActions.length ? run.recentOperatorActions.map(action => (
          <div key={action.id} className="rounded bg-paper px-3 py-2 text-xs font-semibold text-muted">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-ink">{humanize(action.actionType)}</strong>
              <span>{formatDate(action.createdAt)}</span>
            </div>
            <p className="mt-1">{action.actorRole} · {shortId(action.actorId)}</p>
            {action.note ? <p className="mt-1 text-ink">{action.note}</p> : null}
          </div>
        )) : <p className="text-xs font-semibold text-muted">No operator actions recorded.</p>}
      </div>
    </section>
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

function PriorityBadge({ band, score }: { band: FlowControlCenterRun["intelligence"]["priorityBand"]; score: number }) {
  const className = band === "critical" ? "bg-rust text-white" : band === "high" ? "bg-gold/20 text-ink" : band === "medium" ? "bg-teal/10 text-teal" : "bg-paper text-muted";
  return <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider ${className}`}>{band} · {score}</span>;
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
