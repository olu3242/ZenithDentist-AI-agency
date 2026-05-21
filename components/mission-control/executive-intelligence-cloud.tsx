import type { ExecutiveIntelligenceCloudState } from "@/lib/runtime/operational-cloud";

export function ExecutiveIntelligenceCloud({ cloud }: { cloud: ExecutiveIntelligenceCloudState }) {
  return (
    <section className="rounded border border-[#273244] bg-[#0f1115] p-5 text-[#f5f2ed] shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-[#c8922a]">Executive Intelligence Cloud</p>
      <h2 className="mt-1 text-2xl font-black">Enterprise operational strategy</h2>
      <p className="mt-3 text-sm font-semibold text-[#94a3b8]">{cloud.summary}</p>
      <div className="mt-5 grid gap-3">
        {[cloud.resilienceStrategy, cloud.governanceStrategy, ...cloud.ecosystemRecommendations].slice(0, 5).map(item => (
          <div key={item} className="rounded border border-white/10 bg-[#161a22] p-4 text-sm font-semibold text-[#94a3b8]">{item}</div>
        ))}
      </div>
    </section>
  );
}
