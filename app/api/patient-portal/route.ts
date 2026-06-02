import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPatientPortalItems, addPatientPortalItem } from "@/lib/patient-portal";
import type { PortalItemType } from "@/lib/patient-portal";

export async function GET(req: NextRequest) {
  try {
    const organizationId = req.nextUrl.searchParams.get("organizationId");
    const patientExternalId = req.nextUrl.searchParams.get("patientExternalId");
    if (!organizationId || !patientExternalId) {
      return NextResponse.json({ ok: false, error: "organizationId and patientExternalId required" }, { status: 400 });
    }
    const data = await getPatientPortalItems(organizationId, patientExternalId);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

const PostSchema = z.object({
  organizationId: z.string(),
  patientExternalId: z.string(),
  itemType: z.enum(["video", "education", "treatment_guide", "recovery_instructions", "membership_content", "follow_up"]),
  title: z.string(),
  contentUrl: z.string().optional(),
  journeyAssignmentId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = PostSchema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ ok: false, error: body.error.flatten() }, { status: 400 });
    const result = await addPatientPortalItem({ ...body.data, itemType: body.data.itemType as PortalItemType });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
