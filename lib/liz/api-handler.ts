import "server-only";

import { getLizAdvisorResponse } from "@/lib/liz/advisor";
import { retrieveLizKnowledge } from "@/lib/liz/knowledge";

export async function handleLizBriefing(organizationId: string) {
  void organizationId;
  const recommendations = retrieveLizKnowledge(
    "implementation readiness revenue recovery workflow automation patient growth",
    5
  );
  return { ok: true, data: { recommendations } };
}

export async function handleLizQuery(organizationId: string, query: string) {
  void organizationId;
  const result = getLizAdvisorResponse(query);
  return { ok: true, data: result };
}
