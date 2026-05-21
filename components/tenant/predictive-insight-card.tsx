export function PredictiveInsightCard({
  insight
}: {
  insight: { title: string; prediction: string; impact: string; confidence: number };
}) {
  return (
    <article className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-teal">{Math.round(insight.confidence * 100)}% confidence</p>
      <h3 className="mt-2 text-lg font-black">{insight.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{insight.prediction}</p>
      <div className="mt-4 rounded bg-blue/10 p-3 text-sm font-bold text-blue">{insight.impact}</div>
    </article>
  );
}
