import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getScriptTemplates, createScriptTemplate } from "@/lib/script-engine";

export async function GET(req: NextRequest) {
  try {
    const organizationId = req.nextUrl.searchParams.get("organizationId");
    if (!organizationId) return NextResponse.json({ ok: false, error: "organizationId required" }, { status: 400 });
    const category = req.nextUrl.searchParams.get("category") ?? undefined;
    const channel = req.nextUrl.searchParams.get("channel") ?? undefined;
    const data = await getScriptTemplates(organizationId, { category, channel });
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

const PostSchema = z.object({
  organizationId: z.string(),
  templateName: z.string(),
  journeyType: z.string(),
  category: z.string(),
  channel: z.string(),
  contentTemplate: z.string(),
  variables: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  try {
    const body = PostSchema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ ok: false, error: body.error.flatten() }, { status: 400 });
    const result = await createScriptTemplate(body.data);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
