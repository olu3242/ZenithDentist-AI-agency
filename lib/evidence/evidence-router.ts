import type { EvidenceInput } from "@/lib/evidence/evidence-registry";
import { evidenceRegistry } from "@/lib/evidence/evidence-registry";

export function routeEvidence(input: EvidenceInput) {
  const target = evidenceRegistry[input.type];
  return {
    table: target.table,
    operationalEvent: `${input.source}.${input.action}`,
    evidenceEvent: `evidence.${input.type.toLowerCase()}`,
    auditEvent: `audit.${input.source}`,
    certificationEvent: `certification.${input.type.toLowerCase()}`
  };
}
