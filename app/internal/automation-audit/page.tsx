import { AutomationAuditCenter } from "@/components/mission-control/automation-audit-center";
import { AutomationBlueprintTable } from "@/components/mission-control/automation-blueprint-table";
import { AutomationDomainMatrix } from "@/components/mission-control/automation-domain-matrix";
import { AutomationGapPanel } from "@/components/mission-control/automation-gap-panel";
import { E2EChecklistPanel } from "@/components/mission-control/e2e-checklist-panel";
import { InternalHeader } from "@/components/internal/internal-header";
import { getAutomationAuditState } from "@/lib/automation-audit";

export default async function AutomationAuditPage() {
  const state = await getAutomationAuditState();
  return (
    <div className="space-y-6">
      <InternalHeader title="Automation E2E Audit" subtitle="Operational domain coverage, event emissions, ALICE visibility, replay readiness, and telemetry completeness." />
      <AutomationAuditCenter state={state} />
      <AutomationDomainMatrix state={state} />
      <AutomationGapPanel state={state} />
      <E2EChecklistPanel state={state} />
      <AutomationBlueprintTable state={state} />
    </div>
  );
}
