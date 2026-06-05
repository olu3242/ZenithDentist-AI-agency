import { Brain } from "lucide-react";
import { ExecutiveKPI } from "@/components/widgets/executive-kpi";

export function RecommendationCard({ title, detail }: { title: string; detail: string }) {
  return <ExecutiveKPI label="ALICE Recommendation" value={title} detail={detail} trend="Role-aware next action" icon={Brain} />;
}
