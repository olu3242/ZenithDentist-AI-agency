import type { AutomationAuditState } from "@/lib/automation-audit";

export function AutomationBlueprintTable({ state }: { state: AutomationAuditState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Automation blueprint registry</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Triggers, actions, event emissions, and ALICE visibility</h2>
      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[900px] divide-y divide-line rounded border border-line">
          {state.coverageResults.map(result => {
            const blueprint = state.blueprints.find(item => item.id === result.blueprint_id);
            return (
              <div key={result.id} className="grid grid-cols-[1.1fr_.9fr_.7fr_.7fr_.7fr] gap-4 bg-paper p-4">
                <div>
                  <strong className="text-sm font-black text-ink">{result.name}</strong>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted">{result.domain.replace(/_/g, " ")}</p>
                </div>
                <p className="text-sm font-semibold text-muted">{blueprint?.purpose}</p>
                <Score label="ALICE" value={result.alice_visibility_score} />
                <Score label="Replay" value={result.replay_readiness_score} />
                <Score label="Telemetry" value={result.telemetry_score} />
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
      <p className="mt-1 text-xl font-black text-teal">{Math.round(value * 100)}%</p>
    </div>
  );
}
