import type { OperationalPlaybook } from "@/lib/autonomous";

export function OptimizationQueue({ playbooks }: { playbooks: OperationalPlaybook[] }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Optimization Queue</h2>
      <div className="mt-5 grid gap-3">
        {playbooks.map(playbook => (
          <article key={playbook.id} className="rounded bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <strong>{playbook.name}</strong>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black">{Math.round(playbook.confidence * 100)}%</span>
            </div>
            <p className="mt-2 text-sm text-muted">{playbook.recommendedActions[0]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
