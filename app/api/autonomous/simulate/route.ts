import { NextResponse } from "next/server";
import { z } from "zod";
import { runOperationalSimulation } from "@/lib/autonomous";

const schema = z.object({
  reminderTimingDelta: z.coerce.number().optional(),
  recallCadenceDelta: z.coerce.number().optional(),
  staffingDelta: z.coerce.number().optional(),
  reviewTimingDelta: z.coerce.number().optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: true, simulation: await runOperationalSimulation(parsed.data) });
}
