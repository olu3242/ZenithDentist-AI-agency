import { NextResponse } from "next/server";
import { getPlatformFoundationState } from "@/lib/platform-os";

export async function GET() {
  return NextResponse.json({ ok: true, platform: await getPlatformFoundationState() });
}
