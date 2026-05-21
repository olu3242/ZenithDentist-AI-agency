import { AliceResponseCard } from "@/components/alice/alice-response-card";
import { AIConfidenceCard } from "@/components/autonomous/ai-confidence-card";
import { PortalHeader } from "@/components/portal/portal-header";
import { generateAliceInsights, answerOperationalQuery } from "@/lib/alice";
import { getAutonomousEngineState } from "@/lib/autonomous";

export default async function PortalAlicePage() {
  const [response, insights, state] = await Promise.all([
    answerOperationalQuery("Where should we optimize next?"),
    generateAliceInsights(),
    getAutonomousEngineState()
  ]);

  return (
    <div className="space-y-6">
      <PortalHeader title="ALICE Operational Intelligence" subtitle="Executive operational strategy, risk forecasting, and revenue optimization reasoning." />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <AliceResponseCard response={response} />
        <AIConfidenceCard confidence={state.confidence} />
      </div>
      <section className="grid gap-4 xl:grid-cols-3">
        {insights.map(insight => (
          <article key={insight.title} className="rounded border border-line bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-teal">{Math.round(insight.confidence * 100)}% confidence</p>
            <h3 className="mt-2 text-lg font-black">{insight.title}</h3>
            <p className="mt-2 text-sm text-muted">{"summary" in insight ? insight.summary : insight.prediction}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
