import type { CertificationMetric, ProductionCertificationState } from "@/lib/production-certification";

const statusClass: Record<string, string> = {
  certified: "border-green/30 bg-green/10 text-green",
  pilot: "border-gold/30 bg-gold/10 text-gold",
  pending: "border-line bg-paper text-muted",
  failed: "border-rust/30 bg-rust/10 text-rust",
  blocked: "border-rust/30 bg-rust/10 text-rust"
};

export function CertificationCenter({ state }: { state: ProductionCertificationState }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="rounded border border-line bg-white p-5 shadow-sm">
        <p className="brand-kicker">Production evidence dashboard</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Production Certification Center</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold text-muted">
          Evidence coverage for AI Revenue Intelligence traceability, workflow proof, revenue attribution, connector certification, forecasting, reports, roles, and public claim governance.
        </p>
        <p className="mt-4 text-xs font-black uppercase tracking-wider text-muted">Generated {new Date(state.generatedAt).toLocaleString()}</p>
      </header>

      <MetricGrid metrics={state.summary} />
      <section className="grid gap-6 xl:grid-cols-2">
        <EvidencePanel title="AI Decision Traceability" metrics={state.aliceTraceability} />
        <EvidencePanel title="Workflow Proof" metrics={state.workflowProof} />
        <EvidencePanel title="Revenue Attribution" metrics={state.revenueAttribution} />
        <EvidencePanel title="Executive Dashboard Proof" metrics={state.missionControlProof} />
        <EvidencePanel title="Connector Certification" metrics={state.connectorCertification} />
        <EvidencePanel title="Forecasting Certification" metrics={state.forecastingCertification} />
        <EvidencePanel title="Report Traceability" metrics={state.reportTraceability} />
        <EvidencePanel title="Role Workspace Certification" metrics={state.roleWorkspaceCertification} />
      </section>

      <section className="rounded border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-muted">Claim governance</p>
            <h2 className="text-2xl font-black text-ink">Public Claim Registry</h2>
          </div>
          <span className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black text-muted">
            {state.claimGovernance.filter(claim => claim.publicAllowed).length} public-ready
          </span>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-black uppercase tracking-wider text-muted">
                <th className="py-3 pr-4">Claim</th>
                <th className="py-3 pr-4">Feature</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Public</th>
                <th className="py-3 pr-4">Owner</th>
              </tr>
            </thead>
            <tbody>
              {state.claimGovernance.map(claim => (
                <tr key={`${claim.feature}-${claim.claim}`} className="border-b border-line/70">
                  <td className="py-3 pr-4 font-bold text-ink">{claim.claim}</td>
                  <td className="py-3 pr-4 text-muted">{claim.feature}</td>
                  <td className="py-3 pr-4"><Status status={claim.status} /></td>
                  <td className="py-3 pr-4 font-black text-ink">{claim.publicAllowed ? "Allowed" : "Pilot only"}</td>
                  <td className="py-3 pr-4 text-muted">{claim.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricGrid({ metrics }: { metrics: CertificationMetric[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map(metric => (
        <article key={metric.label} className="rounded border border-line bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-muted">{metric.label}</p>
          <strong className="mt-2 block text-3xl font-black text-ink">{metric.value}</strong>
          <div className="mt-3"><Status status={metric.status} /></div>
        </article>
      ))}
    </section>
  );
}

function EvidencePanel({ title, metrics }: { title: string; metrics: CertificationMetric[] }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-ink">{title}</h2>
      <div className="mt-4 grid gap-3">
        {metrics.map(metric => (
          <article key={`${title}-${metric.label}`} className="rounded border border-line bg-paper p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-muted">{metric.label}</p>
                <strong className="mt-1 block text-lg font-black text-ink">{metric.value}</strong>
              </div>
              <Status status={metric.status} />
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{metric.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Status({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase ${statusClass[status] ?? statusClass.pending}`}>
      {status}
    </span>
  );
}
