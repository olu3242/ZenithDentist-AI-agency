import { RevenueLeakDonut, RevenueTrendChart } from "@/components/charts";
import { OpportunityCard } from "@/components/widgets";
import { revenueLeakData, revenueTrendData } from "@/components/executive/sample-data";

export function RevenueRecoveryWidget({ recoveredRevenue = 88000, recoverableRevenue = 142000 }: { recoveredRevenue?: number; recoverableRevenue?: number }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-gold">Revenue Intelligence</p>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
        <RevenueTrendChart data={revenueTrendData} />
        <div className="space-y-4">
          <RevenueLeakDonut data={revenueLeakData} />
          <OpportunityCard title="Recoverable revenue across recall, treatment, no-show, and insurance leakage" value={`$${recoverableRevenue.toLocaleString()}`} />
          <OpportunityCard title="Revenue already recovered by active workflows" value={`$${recoveredRevenue.toLocaleString()}`} />
        </div>
      </div>
    </section>
  );
}
