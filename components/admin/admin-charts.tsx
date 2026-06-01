import { formatCurrency } from "@/lib/utils";
import type { Lead, RoiCalculation, OutreachEvent } from "@/lib/data/leads";

export function AdminCharts({
  leads,
  roiCalculations,
  events
}: {
  leads: Lead[];
  roiCalculations: RoiCalculation[];
  events: OutreachEvent[];
}) {
  const leadGrowth = groupByDay(leads.map(lead => lead.created_at));
  const maxLeadCount = Math.max(1, ...leadGrowth.map(item => item.count));
  const totalRecovery = roiCalculations.reduce((sum, item) => sum + Number(item.recoverable_revenue), 0);
  const eventCounts = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
      <section className="rounded border border-card bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black">Lead Growth</h2>
            <p className="text-sm text-muted">Daily captured leads from the production funnel.</p>
          </div>
          <strong className="text-xl text-accent">{leads.length}</strong>
        </div>
        <div className="mt-6 grid h-64 grid-cols-7 items-end gap-3 border-b border-card">
          {leadGrowth.map(item => (
            <div key={item.day} className="relative rounded-t bg-accent" style={{ height: `${Math.max(8, (item.count / maxLeadCount) * 220)}px` }}>
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-muted">{item.count}</span>
              <small className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 text-xs text-muted">{item.day}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded border border-card bg-white p-5">
        <h2 className="text-lg font-black">Funnel Signals</h2>
        <p className="text-sm text-muted">Conversion events and revenue intelligence.</p>
        <div className="mt-5 grid gap-3">
          <Signal label="Projected recovery" value={formatCurrency(totalRecovery)} />
          <Signal label="Audit requests" value={String(eventCounts.audit_requested ?? 0)} />
          <Signal label="Booking clicks" value={String(eventCounts.booking_clicked ?? 0)} />
          <Signal label="FAQ interactions" value={String(eventCounts.faq_interaction ?? 0)} />
        </div>
      </section>
    </div>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded bg-background px-4 py-3">
      <span className="text-sm font-bold text-muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function groupByDay(dates: string[]) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date;
  });

  return days.map(date => {
    const key = date.toISOString().slice(0, 10);
    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      count: dates.filter(item => item.slice(0, 10) === key).length
    };
  });
}
