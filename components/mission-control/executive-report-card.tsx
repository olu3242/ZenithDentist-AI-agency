import type { ExecutiveReportSnapshot } from "@/lib/runtime/executive-reporting";

export function ExecutiveReportCard({ report }: { report: ExecutiveReportSnapshot }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Executive reporting engine</p>
      <h2 className="mt-1 text-2xl font-black text-ink">{report.title}</h2>
      <p className="mt-2 text-sm font-semibold text-muted">{report.summary}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Metric label="Runtime health" value={`${report.runtimeHealth}%`} />
        <Metric label="SLA compliance" value={`${report.slaCompliance}%`} />
        <Metric label="Provider reliability" value={`${report.providerReliability}%`} />
        <Metric label="Replay candidates" value={String(report.replayCandidates)} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {report.exportFormats.map(format => (
          <span key={format} className="rounded-full bg-teal/10 px-3 py-1 text-xs font-black text-teal">{format.replace(/_/g, " ")}</span>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-paper p-3">
      <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      <strong className="mt-1 block text-xl font-black text-ink">{value}</strong>
    </div>
  );
}
