export function OperationalTimeline({
  events
}: {
  events: Array<{ id: string; title: string; type: string; severity: string; createdAt: string }>;
}) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Operational Intelligence Timeline</h2>
      <div className="mt-5 grid gap-3">
        {events.map(event => (
          <article key={event.id} className="rounded border border-line p-4">
            <p className="text-xs font-black uppercase tracking-wider text-muted">{event.type} · {event.severity}</p>
            <strong className="mt-1 block">{event.title}</strong>
            <small className="text-muted">{new Date(event.createdAt).toLocaleString()}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
