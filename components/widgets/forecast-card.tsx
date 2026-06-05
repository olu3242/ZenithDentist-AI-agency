import { TrendingUp } from "lucide-react";
import { ExecutiveKPI } from "@/components/widgets/executive-kpi";

export function ForecastCard({ label, value, confidence }: { label: string; value: string; confidence: number }) {
  return <ExecutiveKPI label={label} value={value} detail={`${confidence}% forecast confidence`} trend="ALICE forecast active" icon={TrendingUp} />;
}
