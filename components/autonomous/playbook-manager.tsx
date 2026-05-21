import type { OperationalPlaybook } from "@/lib/autonomous";

export function PlaybookManager({ playbooks }: { playbooks: OperationalPlaybook[] }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {playbooks.map(playbook => (
        <article key={playbook.id} className="rounded border border-line bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-teal">{playbook.category}</p>
          <h3 className="mt-2 text-xl font-black">{playbook.name}</h3>
          <div className="mt-4 grid gap-3">
            <Block label="Trigger conditions" values={playbook.triggerConditions} />
            <Block label="Recommended actions" values={playbook.recommendedActions} />
            <Block label="Rollback logic" values={playbook.rollbackLogic} />
            <Block label="Approval flow" values={playbook.approvalFlow} />
          </div>
        </article>
      ))}
    </section>
  );
}

function Block({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      <ul className="mt-1 grid gap-1 text-sm text-muted">
        {values.map(value => <li key={value}>{value}</li>)}
      </ul>
    </div>
  );
}
