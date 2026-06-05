import { Wallet } from "lucide-react";
import { ExecutiveKPI } from "@/components/widgets/executive-kpi";

export function OpportunityCard({ title, value }: { title: string; value: string }) {
  return <ExecutiveKPI label="Opportunity" value={value} detail={title} trend="Ranked by revenue potential" icon={Wallet} />;
}
