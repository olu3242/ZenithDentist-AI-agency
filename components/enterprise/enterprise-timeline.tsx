import type { EnterpriseCloudState } from "@/lib/enterprise-cloud";

export function EnterpriseTimeline({ state }: { state: EnterpriseCloudState }) {
  const rows = [
    ...state.forecasts.slice(0, 2).map(item => ({ id: item.id, title: item.forecast_type.replace(/_/g, " "), detail: `${Math.round(item.probability * 100)}% probability`, type: "forecast" })),
    ...state.governance.slice(0, 2).map(item => ({ id: item.id, title: item.governed_object_type.replace(/_/g, " "), detail: item.status.replace(/_/g, " "), type: "governance" })),
    ...state.playbooks.slice(0, 2).map(item => ({ id: item.id, title: item.name, detail: item.status, type: "playbook" }))
  ];

  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Enterprise intelligence timeline</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Forecasts, approvals, and optimization movement</h2>
      <div className="mt-5 grid gap-3">
        {rows.map(row => (
          <div key={`${row.type}-${row.id}`} className="flex items-center justify-between gap-4 rounded border border-line bg-paper p-4">
            <div>
              <strong className="text-sm font-black text-ink">{row.title}</strong>
              <p className="text-sm font-semibold text-muted">{row.detail}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-teal">{row.type}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
