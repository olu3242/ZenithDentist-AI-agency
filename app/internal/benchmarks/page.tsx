import { BenchmarkPanel } from "@/components/tenant/benchmark-panel";
import { InternalHeader } from "@/components/internal/internal-header";
import { getInternalPlatformData } from "@/lib/data/internal";

export default async function InternalBenchmarksPage() {
  const { tenantData } = await getInternalPlatformData();
  return (
    <div className="space-y-6">
      <InternalHeader title="Benchmark Intelligence" subtitle="Cross-practice intelligence prepared for cohort analysis and defensible operational comparisons." />
      <BenchmarkPanel benchmark={tenantData.benchmarks[0]} />
    </div>
  );
}
