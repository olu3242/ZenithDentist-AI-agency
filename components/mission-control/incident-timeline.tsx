import type { RuntimeIncident } from "@/lib/runtime/incident-management";

export function IncidentTimeline({ incidents }: { incidents: RuntimeIncident[] }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Incident Center</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Mitigation timelines</h2>
      <div className="mt-5 grid gap-3">
        {incidents.length ? incidents.slice(0, 8).map(incident => (
          <div key={incident.id} className="rounded border border-card bg-background p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <strong className="text-sm font-black text-[#F8FAFC]">{incident.title}</strong>
              <span className={incident.severity === "critical" ? "text-xs font-black uppercase text-danger" : "text-xs font-black uppercase text-warning"}>{incident.severity}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{incident.rootCause}</p>
            <ol className="mt-3 border-l border-card pl-4">
              {incident.timeline.slice(0, 3).map(item => (
                <li key={`${incident.id}-${item.label}`} className="mb-3 last:mb-0">
                  <p className="text-xs font-black uppercase tracking-wider text-accent">{item.label}</p>
                  <p className="text-sm font-semibold text-muted">{item.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        )) : (
          <div className="rounded border border-card bg-background p-4 text-sm font-semibold text-muted">No active incidents are present.</div>
        )}
      </div>
    </section>
  );
}
