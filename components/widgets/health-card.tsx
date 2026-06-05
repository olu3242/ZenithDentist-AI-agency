import { HeartPulse } from "lucide-react";
import { ExecutiveKPI } from "@/components/widgets/executive-kpi";

export function HealthCard({ label, score, detail }: { label: string; score: number; detail: string }) {
  return <ExecutiveKPI label={label} value={`${score}%`} detail={detail} trend={score >= 80 ? "Healthy" : "Needs attention"} icon={HeartPulse} />;
}
