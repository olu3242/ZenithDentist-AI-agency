import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listDigitalDentistTwins, createDigitalDentistTwin } from "@/lib/digital-dentist-twin";

export async function GET(req: NextRequest) {
  try {
    const organizationId = req.nextUrl.searchParams.get("organizationId");
    if (!organizationId) return NextResponse.json({ ok: false, error: "organizationId required" }, { status: 400 });
    const data = await listDigitalDentistTwins(organizationId);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

const PostSchema = z.object({
  organizationId: z.string(),
  displayName: z.string(),
  specialty: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = PostSchema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ ok: false, error: body.error.flatten() }, { status: 400 });
    const result = await createDigitalDentistTwin(body.data);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
