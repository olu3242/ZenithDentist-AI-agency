import { NextResponse } from "next/server";
import { z } from "zod";
import {
  generatePatientDecision,
  getPendingPatientDecisions,
} from "@/lib/alice/patient-decision-engine";

const postSchema = z.object({
  organizationId: z.string().min(1),
  patientExternalId: z.string().min(1),
  context: z.record(z.unknown()).optional(),
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
    const decision = await generatePatientDecision(parsed.data);
    return NextResponse.json({ ok: true, decision });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Missing organizationId" }, { status: 400 });
  }
  try {
    const decisions = await getPendingPatientDecisions(organizationId);
    return NextResponse.json({ ok: true, decisions });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
