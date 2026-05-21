import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { faqInteractionSchema } from "@/lib/validation";
import { trackOutreachEvent } from "@/lib/data/leads";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = faqInteractionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid FAQ payload" }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    logger.warn("faq_not_persisted_supabase_missing", parsed.data);
    return NextResponse.json({ ok: true, persisted: false });
  }

  const { error } = await supabase.from("faq_interactions").insert({
    question: parsed.data.question,
    category: parsed.data.category,
    interaction_type: parsed.data.interactionType
  });

  if (error) {
    logger.error("faq_persist_failed", { error: error.message });
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  await trackOutreachEvent({
    eventType: "faq_interaction",
    metadata: parsed.data
  });

  return NextResponse.json({ ok: true });
}
