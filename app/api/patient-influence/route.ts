import { NextResponse } from "next/server";
import { z } from "zod";
import {
  calculateInfluenceScores,
  getInfluenceScores,
  getHighInfluencePatients,
} from "@/lib/patient-influence";

const postSchema = z.object({
  organizationId: z.string().min(1),
  patientExternalId: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Missing organizationId or patientExternalId" }, { status: 400 });
  }
  try {
    const scores = await calculateInfluenceScores(
      parsed.data.organizationId,
      parsed.data.patientExternalId
    );
    return NextResponse.json({ ok: true, scores });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");
  const patientExternalId = searchParams.get("patientExternalId");

  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Missing organizationId" }, { status: 400 });
  }

  try {
    if (patientExternalId) {
      const scores = await getInfluenceScores(organizationId, patientExternalId);
      return NextResponse.json({ ok: true, scores });
    }
    const patients = await getHighInfluencePatients(organizationId);
    return NextResponse.json({ ok: true, patients });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
