import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { z } from "zod";

const schema = z.object({
  approvalId: z.string().min(2),
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().max(1000).optional()
});

export async function POST(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json().catch(() => null);
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
