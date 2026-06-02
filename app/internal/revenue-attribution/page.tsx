import { EnterpriseOperationsCenter } from "@/components/internal/enterprise-operations-center";
import { getEnterpriseOperationsState } from "@/lib/enterprise-operations";

export default async function InternalRevenueAttributionPage() {
  const state = await getEnterpriseOperationsState();
  return <EnterpriseOperationsCenter state={state} section="revenue-attribution" />;
}
