import { NextResponse } from "next/server";
import { z } from "zod";
import { predictTreatmentAcceptance } from "@/lib/treatment-intelligence";

const postSchema = z.object({
  organizationId: z.string().min(1),
  patientExternalId: z.string().min(1),
  procedureType: z.enum([
    "implant",
    "invisalign",
    "crown",
    "veneer",
    "root_canal",
    "high_value",
    "standard",
    "other",
  ]),
  estimatedRevenue: z.number().optional(),
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
    const prediction = await predictTreatmentAcceptance(parsed.data);
    return NextResponse.json({ ok: true, prediction });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
