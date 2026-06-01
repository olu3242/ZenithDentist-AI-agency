import { getEnterpriseCloudState } from "@/lib/enterprise-cloud";
import { reconcileOpenDentalBatch, pilotOpenDentalRecords } from "@/lib/open-dental";
import { getSupportedPMSProviders } from "@/lib/pms";

export async function getPMSOperationsState() {
  const cloud = await getEnterpriseCloudState();
  const pilotRecords = pilotOpenDentalRecords();
  const reconciliation = reconcileOpenDentalBatch(pilotRecords);
  const providers = getSupportedPMSProviders();
  const configuredProviders = cloud.providerCoverage.filter(provider => provider.configured);
  const syncHealth = cloud.integrations.length
    ? Math.round(cloud.integrations.reduce((sum, integration) => sum + integration.health_score, 0) / cloud.integrations.length)
    : 0;
  const errors = cloud.integrations.filter(integration => integration.status === "failed" || integration.status === "degraded" || integration.health_score < 70);

  return {
    cloud,
    providers,
    configuredProviders,
    syncHealth,
    mappings: cloud.providerCoverage.map(provider => ({
      provider: provider.displayName,
      status: provider.configured ? "mapped" : "ready",
      canonicalEntity: provider.provider === "open_dental" ? "normalized_healthcare_events" : "pms_integrations"
    })),
    reconciliation: {
      accepted: reconciliation.accepted.length,
      duplicates: reconciliation.duplicates.length,
      hash: reconciliation.reconciliationHash,
      source: pilotRecords.length ? "open_dental_batch" : "no_live_batch"
    },
    logs: [
      ...cloud.integrations.map(integration => ({
        id: integration.id,
        label: `${integration.display_name} sync status ${integration.status}`,
        detail: `Provider ${integration.provider}; health ${integration.health_score}%`,
        at: integration.updated_at
      })),
      ...cloud.revenueRuns.slice(0, 5).map(run => ({
        id: run.id,
        label: "Revenue orchestration run",
        detail: `$${Math.round(run.recovery_prioritized).toLocaleString()} prioritized; confidence ${Math.round(run.confidence * 100)}%`,
        at: run.run_at
      }))
    ],
    errors,
    importExport: {
      importSource: "/api/opendental/sync",
      exportSource: "normalized_healthcare_events",
      supportedProviders: providers.length,
      readyProviders: providers.length - configuredProviders.length
    }
  };
}
