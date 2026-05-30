import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

export async function writeAIMemory(input: { organizationId: string; memoryType: string; summary: string; metadata?: Record<string, unknown> }) {
  const supabase = createServiceClient();
  if (!supabase) return { persisted: false };
  const { error } = await (supabase as any).from("ai_memory_entries").insert({
    organization_id: input.organizationId,
    memory_type: input.memoryType,
    summary: input.summary,
    metadata: (input.metadata ?? {}) as Json
  });
  return { persisted: !error, error: error?.message };
}
