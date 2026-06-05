import { ProviderPerformanceBar } from "@/components/charts";
import { HealthCard } from "@/components/widgets";
import { providerPerformanceData } from "@/components/executive/sample-data";

export function ProviderLeaderboard() {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-gold">Provider Command Center</p>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_.7fr]">
        <ProviderPerformanceBar data={providerPerformanceData} />
        <div className="grid gap-3">
          <HealthCard label="Top Provider" score={94} detail="Production, collections, acceptance, reviews, and referrals" />
          <HealthCard label="Capacity Risk" score={74} detail="Open provider capacity that can convert into production" />
        </div>
      </div>
    </section>
  );
}
