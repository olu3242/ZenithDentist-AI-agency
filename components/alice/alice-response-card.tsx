import type { AliceFrameworkResponse } from "@/lib/alice";

export function AliceResponseCard({ response }: { response: AliceFrameworkResponse }) {
  const sections = [
    ["Observation", response.observation],
    ["Operational interpretation", response.operationalInterpretation],
    ["Revenue impact", response.revenueImpact],
    ["Recommendation", response.recommendation],
    ["Expected improvement", response.expectedImprovement]
  ];

  return (
    <section className="rounded border border-line bg-white p-6 shadow-soft">
      <p className="text-xs font-black uppercase tracking-wider text-teal">ALICE</p>
      <h2 className="mt-2 text-2xl font-black">Autonomous Operational Intelligence Copilot</h2>
      <div className="mt-5 grid gap-3">
        {sections.map(([label, value]) => (
          <div key={label} className="rounded bg-paper p-4">
            <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
            <p className="mt-2 text-sm leading-6">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
