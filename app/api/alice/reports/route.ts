import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAliceReport } from "@/lib/alice";

const schema = z.object({
  period: z.enum(["daily", "weekly", "monthly"]).default("weekly")
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: true, report: await generateAliceReport(parsed.data.period) });
}
