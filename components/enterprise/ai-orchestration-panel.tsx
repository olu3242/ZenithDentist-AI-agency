import type { EnterpriseCloudState } from "@/lib/enterprise-cloud";

export function AIOrchestrationPanel({ state }: { state: EnterpriseCloudState }) {
  return (
    <section className="rounded border border-line bg-ink p-5 text-white shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-white/55">AI ecosystem orchestration</p>
      <h2 className="mt-1 text-2xl font-black">Provider routing, fallback, and intelligence specialization</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {state.confidenceMatrix.map(item => (
          <article key={item.label} className="rounded border border-white/10 bg-white/8 p-4">
            <strong className="text-sm font-black text-white">{item.label}</strong>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-black text-gold">{item.reliability}%</p>
                <p className="text-xs font-bold uppercase text-white/50">Reliability</p>
              </div>
              <div>
                <p className="text-2xl font-black text-teal">{item.certainty}%</p>
                <p className="text-xs font-bold uppercase text-white/50">Certainty</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-white/65">{item.lift}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
