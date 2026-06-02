import "server-only";

import { generateLizBriefing, answerLizQuery } from "./index";

export async function handleLizBriefing(organizationId: string) {
  const recommendations = await generateLizBriefing(organizationId);
  return { ok: true, data: { recommendations } };
}

export async function handleLizQuery(organizationId: string, query: string) {
  const result = await answerLizQuery(organizationId, query);
  return { ok: true, data: result };
}
