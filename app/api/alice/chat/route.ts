import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId } from "@/lib/tenant/tenant-guards";
import { z } from "zod";
import { answerOperationalQuery } from "@/lib/alice";

const schema = z.object({
  question: z.string().min(3).max(1000)
});

export async function POST(req: NextRequest) {
  const orgId = extractOrgId(req);
  const ctx = await withTenantGuard(orgId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Question is required." }, { status: 400 });
  }

  const response = await answerOperationalQuery(parsed.data.question);
  return NextResponse.json({ ok: true, response });
}
