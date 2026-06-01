import type { RuntimeHealthState } from "@/lib/runtime/automation-health";
import { suggestRemediation } from "@/lib/runtime/self-healing";

export function DeadLetterExplorer({ state }: { state: RuntimeHealthState }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Dead-letter explorer</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Replay queue and failure remediation</h2>
      <div className="mt-5 grid gap-3">
        {state.deadLetters.length ? state.deadLetters.map(letter => {
          const remediation = suggestRemediation({ workflowId: letter.workflow_id, failureReason: letter.failure_reason });
          return (
            <div key={letter.id} className="rounded border border-card bg-background p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <strong className="text-sm font-black text-[#F8FAFC]">{letter.workflow_id}</strong>
                <span className={letter.replayable ? "rounded-full bg-success/10 px-3 py-1 text-xs font-black uppercase text-success" : "rounded-full bg-danger/10 px-3 py-1 text-xs font-black uppercase text-danger"}>
                  {letter.replayable ? "replayable" : "manual review"}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-muted">{letter.failure_reason}</p>
              <p className="mt-2 text-sm font-bold text-accent">{remediation.suggestedAction}</p>
            </div>
          );
        }) : (
          <div className="rounded border border-card bg-background p-4 text-sm font-semibold text-muted">No dead letters are present.</div>
        )}
      </div>
    </section>
  );
}
