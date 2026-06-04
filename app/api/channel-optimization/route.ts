import { NextResponse } from "next/server";
import { z } from "zod";
import { selectOptimalChannel } from "@/lib/channel-optimization";

const postSchema = z.object({
  organizationId: z.string().min(1),
  patientExternalId: z.string().min(1),
  journeyType: z.string().min(1),
  procedureType: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  try {
    const recommendation = await selectOptimalChannel(parsed.data);
    return NextResponse.json({ ok: true, recommendation });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
