import type { AutomationEvent } from "@/lib/data/operations";

export function WorkflowVisualizer({ events }: { events: AutomationEvent[] }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Automation Pipeline Visualization</h2>
      <p className="text-sm text-muted">Trigger to action to outcome for active operational systems.</p>
      <div className="mt-5 grid gap-4">
        {events.slice(0, 5).map(event => (
          <div key={event.id} className="grid gap-3 md:grid-cols-[1fr_40px_1fr_40px_1fr] md:items-center">
            <Node label="Trigger" value={event.trigger_name} />
            <Connector />
            <Node label="Action" value={event.action_name} />
            <Connector />
            <Node label="Outcome" value={event.outcome ?? event.status} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Node({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-paper p-3">
      <span className="text-xs font-black uppercase tracking-wider text-muted">{label}</span>
      <strong className="mt-1 block text-sm">{value}</strong>
    </div>
  );
}

function Connector() {
  return <div className="hidden h-px bg-line md:block" />;
}
