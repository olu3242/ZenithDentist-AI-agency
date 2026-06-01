import type { BenchmarkSnapshot } from "@/lib/data/tenants";

export function BenchmarkPanel({ benchmark }: { benchmark?: BenchmarkSnapshot }) {
  const ranks = (benchmark?.percentile_rankings as Record<string, number> | undefined) ?? { noShow: 72, recall: 81, reviews: 54, efficiency: 76 };
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Benchmark Intelligence</h2>
      <p className="text-sm text-muted">Cross-practice comparison against the {benchmark?.cohort ?? "multi-location dental"} cohort.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Benchmark label="No-show improvement" value={ranks.noShow} text={`You outperform ${ranks.noShow}% of practices in no-show improvement.`} />
        <Benchmark label="Recall recovery" value={ranks.recall} text={`You outperform ${ranks.recall}% of practices in recall recovery.`} />
        <Benchmark label="Review generation" value={ranks.reviews} text={ranks.reviews < 60 ? "Review generation is below benchmark." : "Review generation is above benchmark."} />
        <Benchmark label="Operational efficiency" value={ranks.efficiency} text={`Admin efficiency is in the ${ranks.efficiency}th percentile.`} />
      </div>
    </section>
  );
}

function Benchmark({ label, value, text }: { label: string; value: number; text: string }) {
  return (
    <div className="rounded bg-background p-4">
      <div className="flex items-center justify-between">
        <span className="font-bold">{label}</span>
        <strong className="text-accent">{value}%</strong>
      </div>
      <p className="mt-2 text-sm text-muted">{text}</p>
    </div>
  );
}
