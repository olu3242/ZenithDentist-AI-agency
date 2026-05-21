import type { PredictiveOperationalAlert } from "@/lib/runtime/predictive-monitoring";

export function PredictiveAlertFeed({ alerts }: { alerts: PredictiveOperationalAlert[] }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Predictive operational monitoring</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Pre-failure alerts</h2>
      <div className="mt-5 grid gap-3">
        {alerts.length ? alerts.slice(0, 8).map(alert => (
          <div key={alert.id} className="rounded border border-line bg-paper p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <strong className="text-sm font-black text-ink">{alert.title}</strong>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-rust">{alert.severity}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{alert.detail}</p>
          </div>
        )) : (
          <div className="rounded border border-line bg-paper p-4 text-sm font-semibold text-muted">No predictive alerts from live runtime data.</div>
        )}
      </div>
    </section>
  );
}
