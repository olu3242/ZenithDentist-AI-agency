import { RecommendationCard, RiskCard } from "@/components/widgets";

export function AliceExecutiveBriefing({ recommendations = ["Launch recall recovery sequence", "Prioritize denied claims", "Coach treatment presentation follow-up"] }: { recommendations?: string[] }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-gold">ALICE Executive Briefing</p>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {recommendations.slice(0, 3).map(item => <RecommendationCard key={item} title={item} detail="Generated from revenue, patient, provider, PMS, and workflow context." />)}
        <RiskCard title="Revenue leakage and workflow retry drift require weekly executive review." score={22} />
      </div>
    </section>
  );
}
