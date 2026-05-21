import type { AutomationEvent } from "@/lib/data/operations";
import { formatCurrency } from "@/lib/utils";

export function OperationalFeed({ events }: { events: AutomationEvent[] }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Operational Activity Timeline</h2>
      <div className="mt-5 grid gap-3">
        {events.slice(0, 8).map(event => (
          <article key={event.id} className="rounded border border-line p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <strong className="capitalize">{event.workflow}</strong>
                <p className="mt-1 text-sm text-muted">{event.action_name} · {event.outcome}</p>
              </div>
              <span className="rounded-full bg-paper px-2 py-1 text-xs font-black capitalize">{event.status}</span>
            </div>
            {Number(event.recovery_amount) > 0 ? <small className="mt-2 block text-green">{formatCurrency(Number(event.recovery_amount))} recovered</small> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
