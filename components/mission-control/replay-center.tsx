import { RotateCcw } from "lucide-react";
import type { ReplayCenterState } from "@/lib/runtime/replay-engine";

export function ReplayCenter({ replay }: { replay: ReplayCenterState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-muted">Replay center</p>
          <h2 className="mt-1 text-2xl font-black text-ink">Rollback-safe recovery previews</h2>
        </div>
        <div className="grid size-11 place-items-center rounded-full bg-teal/10 text-teal"><RotateCcw size={20} /></div>
      </div>
      <div className="mt-5 grid gap-3">
        {replay.candidates.length ? replay.candidates.slice(0, 8).map(candidate => (
          <div key={candidate.id} className="rounded border border-line bg-paper p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <strong className="text-sm font-black text-ink">{candidate.workflowId}</strong>
              <span className={candidate.rollbackSafe ? "rounded-full bg-green/10 px-3 py-1 text-xs font-black text-green" : "rounded-full bg-rust/10 px-3 py-1 text-xs font-black text-rust"}>
                {candidate.confidence}% confidence
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{candidate.preview}</p>
            <p className="mt-2 text-sm font-black text-teal">{candidate.suggestedAction}</p>
          </div>
        )) : (
          <div className="rounded border border-line bg-paper p-4 text-sm font-semibold text-muted">No replay candidates are present.</div>
        )}
      </div>
    </section>
  );
}
