export function AutonomousAlertFeed({
  events
}: {
  events: Array<{ id: string; title: string; severity: string }>;
}) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Autonomous Alert Feed</h2>
      <div className="mt-4 grid gap-3">
        {events.map(event => (
          <div key={event.id} className="rounded bg-paper p-3">
            <span className="text-xs font-black uppercase tracking-wider text-rust">{event.severity}</span>
            <strong className="mt-1 block">{event.title}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
