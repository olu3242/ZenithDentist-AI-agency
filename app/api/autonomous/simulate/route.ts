import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId } from "@/lib/tenant/tenant-guards";
import { z } from "zod";
import { runOperationalSimulation } from "@/lib/autonomous";

const schema = z.object({
  reminderTimingDelta: z.coerce.number().optional(),
  recallCadenceDelta: z.coerce.number().optional(),
  staffingDelta: z.coerce.number().optional(),
  reviewTimingDelta: z.coerce.number().optional()
});

export async function POST(req: NextRequest) {
  const orgId = extractOrgId(req);
  const ctx = await withTenantGuard(orgId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: true, simulation: await runOperationalSimulation(parsed.data) });
}
