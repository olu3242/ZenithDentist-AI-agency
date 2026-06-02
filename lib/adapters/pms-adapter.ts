import "server-only";

import { logger } from "@/lib/logger";
import type { AdapterResult } from "./communication-adapter";

export function getPMSProvider(): string {
  return process.env.PMS_PROVIDER ?? "opendental";
}

export async function getPMSPatient(
  organizationId: string,
  externalId: string
): Promise<AdapterResult<{ externalId: string; name?: string; lastVisit?: string }>> {
  const provider = getPMSProvider();
  logger.info("pms_adapter_get_patient", { organizationId, externalId, provider });
  return {
    ok: true,
    data: {
      externalId,
      lastVisit: new Date().toISOString()
    }
  };
}

export async function getPMSAppointments(
  organizationId: string,
  patientExternalId: string
): Promise<AdapterResult<any[]>> {
  const provider = getPMSProvider();
  logger.info("pms_adapter_get_appointments", { organizationId, patientExternalId, provider });
  return {
    ok: true,
    data: []
  };
}
