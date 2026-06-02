import { OperationalKnowledgeGraph } from "@/components/enterprise/operational-knowledge-graph";
import { OrganizationalHeatmap } from "@/components/enterprise/organizational-heatmap";
import { DashboardContainer } from "@/components/portal/dashboard-grid";
import { PortalHeader } from "@/components/portal/portal-header";
import { getEnterpriseCloudState } from "@/lib/enterprise-cloud";

export default async function PortalKnowledgePage() {
  const state = await getEnterpriseCloudState();
  return (
    <DashboardContainer>
      <PortalHeader title="Operational Knowledge Graph" subtitle="Relationships between scheduling behavior, staffing efficiency, patient retention, and revenue outcomes." />
      <OperationalKnowledgeGraph state={state} />
      <OrganizationalHeatmap state={state} />
    </DashboardContainer>
  );
}
