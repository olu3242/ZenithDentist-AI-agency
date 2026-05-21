import { AliceResponseCard } from "@/components/alice/alice-response-card";
import { ForecastReliabilityChart } from "@/components/autonomous/forecast-reliability-chart";
import { InternalHeader } from "@/components/internal/internal-header";
import { answerOperationalQuery } from "@/lib/alice";

export default async function InternalAiPage() {
  const response = await answerOperationalQuery("What operational bottlenecks hurt revenue?");
  return (
    <div className="space-y-6">
      <InternalHeader title="ALICE Intelligence Layer" subtitle="Provider-ready operational reasoning, memory architecture, and executive briefing outputs." />
      <AliceResponseCard response={response} />
      <ForecastReliabilityChart />
    </div>
  );
}
