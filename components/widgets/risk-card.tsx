import { AlertTriangle } from "lucide-react";
import { ExecutiveKPI } from "@/components/widgets/executive-kpi";

export function RiskCard({ title, score }: { title: string; score: number }) {
  return <ExecutiveKPI label="Risk" value={`${score}%`} detail={title} trend="Requires executive review" icon={AlertTriangle} />;
}
