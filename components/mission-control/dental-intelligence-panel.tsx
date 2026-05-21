import type { DentalOperationalPrediction } from "@/lib/runtime/dental-intelligence";

export function DentalIntelligencePanel({ predictions }: { predictions: DentalOperationalPrediction[] }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Dental operational intelligence</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Predictive practice signals</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {predictions.map(prediction => (
          <div key={prediction.id} className="rounded border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-ink">{prediction.title}</strong>
              <span className={prediction.impact === "CRITICAL" || prediction.impact === "HIGH" ? "text-xs font-black text-rust" : "text-xs font-black text-teal"}>{prediction.probability}%</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{prediction.recommendation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
