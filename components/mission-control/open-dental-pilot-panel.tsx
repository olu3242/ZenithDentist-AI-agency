import type { MissionControlState } from "@/lib/stability";

export function OpenDentalPilotPanel({ state }: { state: MissionControlState }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-muted">Open Dental pilot</p>
          <h2 className="text-2xl font-black text-[#F8FAFC]">Retry-safe PMS ingestion and normalized event emission</h2>
        </div>
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-black text-accent">{state.openDental.acceptedEvents} accepted</span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[.75fr_1.25fr]">
        <div className="rounded border border-card bg-background p-4">
          <p className="text-sm font-semibold text-muted">Reconciliation hash</p>
          <strong className="mt-2 block text-xl font-black text-[#F8FAFC]">{state.openDental.reconciliationHash}</strong>
          <p className="mt-4 text-sm font-semibold text-muted">{state.openDental.duplicatesPrevented} duplicates prevented across {state.openDental.recordsSeen} records.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {state.openDental.supportedScopes.map(scope => (
            <span key={scope} className="rounded border border-card bg-background px-3 py-2 text-sm font-black text-[#F8FAFC]">{scope}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
