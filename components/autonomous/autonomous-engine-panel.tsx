import type { PracticeHealthScore } from "@/lib/health";

export function AutonomousEnginePanel({ health, confidence }: { health: PracticeHealthScore; confidence: number }) {
  return (
    <section className="rounded border border-line bg-white p-6 shadow-soft">
      <p className="text-xs font-black uppercase tracking-wider text-teal">Zenith Autonomous Operations Engine</p>
      <h2 className="mt-2 text-3xl font-black">Continuous revenue optimization is active.</h2>
      <p className="mt-3 max-w-3xl text-muted">
        Zenith is monitoring operational degradation, forecasting risk, and preparing approval-gated optimizations for the Patient Revenue Engine™.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Signal label="Practice health" value={`${health.overall}/100`} />
        <Signal label="AI confidence" value={`${confidence}%`} />
        <Signal label="Benchmark rank" value={`${health.benchmarkPercentile}%`} />
      </div>
    </section>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-paper p-4">
      <span className="text-xs font-black uppercase tracking-wider text-muted">{label}</span>
      <strong className="mt-2 block text-2xl font-black">{value}</strong>
    </div>
  );
}
