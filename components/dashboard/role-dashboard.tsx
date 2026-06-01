import { PersonaCommandCenter } from "@/components/dashboard/persona-command-center";
import type { AutomationOSState } from "@/lib/automation-os/registry";
import type { AdminDashboardData } from "@/lib/data/leads";
import type { TenantData } from "@/lib/data/tenants";
import { getPersonaByKey, type PersonaKey } from "@/lib/personas";
import type { RuntimeHealthState } from "@/lib/runtime/automation-health";

type RoleDashboardKey = "front-desk" | "provider" | "office-manager" | "practice-owner";

const personaByRoleDashboard: Record<RoleDashboardKey, PersonaKey> = {
  "front-desk": "front_desk_operator",
  provider: "clinical_provider",
  "office-manager": "office_manager",
  "practice-owner": "practice_owner"
};

export function RoleDashboard({
  roleKey,
  tenantData,
  admin,
  runtime,
  automationOS
}: {
  roleKey: RoleDashboardKey;
  tenantData: TenantData;
  admin: AdminDashboardData;
  runtime: RuntimeHealthState;
  automationOS: AutomationOSState;
}) {
  return (
    <PersonaCommandCenter
      persona={getPersonaByKey(personaByRoleDashboard[roleKey])}
      tenantData={tenantData}
      admin={admin}
      runtime={runtime}
      automationOS={automationOS}
    />
  );
}
