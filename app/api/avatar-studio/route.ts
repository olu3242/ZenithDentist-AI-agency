import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listAvatarProfiles, createAvatarProfile } from "@/lib/avatar-studio";
import type { AvatarProvider } from "@/lib/avatar-studio";

export async function GET(req: NextRequest) {
  try {
    const organizationId = req.nextUrl.searchParams.get("organizationId");
    if (!organizationId) return NextResponse.json({ ok: false, error: "organizationId required" }, { status: 400 });
    const data = await listAvatarProfiles(organizationId);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

const PostSchema = z.object({
  organizationId: z.string(),
  displayName: z.string(),
  provider: z.enum(["heygen", "tavus", "synthesia", "d_id", "custom"]),
  specialty: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = PostSchema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ ok: false, error: body.error.flatten() }, { status: 400 });
    const result = await createAvatarProfile({ ...body.data, provider: body.data.provider as AvatarProvider });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
