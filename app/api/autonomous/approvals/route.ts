import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  approvalId: z.string().min(2),
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().max(1000).optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({
    ok: true,
    approval: {
      ...parsed.data,
      decidedAt: new Date().toISOString()
    }
  });
}
