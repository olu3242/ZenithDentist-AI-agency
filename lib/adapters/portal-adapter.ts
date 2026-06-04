import "server-only";

import { addPatientPortalItem } from "@/lib/patient-portal";
import type { PortalItemType } from "@/lib/patient-portal";
import { logger } from "@/lib/logger";
import type { DeliveryResult } from "./communication-adapter";

export async function deliverPortalItem(opts: {
  organizationId: string;
  patientExternalId: string;
  itemType: PortalItemType;
  title: string;
  contentUrl?: string;
  journeyAssignmentId?: string;
}): Promise<DeliveryResult> {
  logger.info("portal_adapter_deliver", {
    organizationId: opts.organizationId,
    patientExternalId: opts.patientExternalId,
    itemType: opts.itemType,
    title: opts.title
  });
  try {
    const result = await addPatientPortalItem({
      organizationId: opts.organizationId,
      patientExternalId: opts.patientExternalId,
      itemType: opts.itemType,
      title: opts.title,
      contentUrl: opts.contentUrl,
      journeyAssignmentId: opts.journeyAssignmentId
    });
    return {
      ok: true,
      channel: "portal",
      provider: "patient_portal",
      externalId: result.itemId,
      deliveredAt: new Date().toISOString()
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error("portal_adapter_error", { error, organizationId: opts.organizationId });
    return { ok: false, channel: "portal", provider: "patient_portal", error };
  }
}
