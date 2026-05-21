import { NextResponse } from "next/server";
import { trackOutreachEvent } from "@/lib/data/leads";

export async function POST(request: Request) {
  const metadata = await request.json().catch(() => ({}));
  await trackOutreachEvent({
    eventType: "funnel_abandoned",
    metadata
  });
  return NextResponse.json({ ok: true });
}
