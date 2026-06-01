import type { AutomationAuditState } from "@/lib/automation-audit";

export function AutomationBlueprintTable({ state }: { state: AutomationAuditState }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Automation blueprint registry</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Triggers, actions, event emissions, and ALICE visibility</h2>
      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[900px] divide-y divide-line rounded border border-card">
          {state.coverageResults.map(result => {
            const blueprint = state.blueprints.find(item => item.id === result.blueprintId);
            return (
              <div key={result.id} className="grid grid-cols-[1.1fr_.9fr_.7fr_.7fr_.7fr_.7fr] gap-4 bg-background p-4">
                <div>
                  <strong className="text-sm font-black text-[#F8FAFC]">{result.name}</strong>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted">{result.domain.replace(/_/g, " ")}</p>
                </div>
                <p className="text-sm font-semibold text-muted">{blueprint?.description}</p>
                <Score label="ALICE" value={result.aliceVisibilityScore} />
                <Score label="Replay" value={result.replayReadinessScore} />
                <Score label="Observe" value={result.observabilityScore} />
                <Score label="SLA" value={result.slaCoverageScore} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-1 text-xl font-black text-accent">{Math.round(value)}%</p>
    </div>
  );
}
