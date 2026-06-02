import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { roleAtLeast } from "@/lib/rbac/roles";
import { handleLizQuery } from "@/lib/liz/api-handler";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  if (!roleAtLeast(ctx.membershipRole, "read_only")) {
    return NextResponse.json({ ok: false, error: "Insufficient role." }, { status: 403 });
  }

  let question = "";
  try {
    const body = await req.json() as { question?: unknown };
    question = typeof body.question === "string" ? body.question.trim() : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  if (!question) {
    return NextResponse.json(
      { ok: false, error: "question is required." },
      { status: 400 }
    );
  }

  try {
    const result = await handleLizQuery(ctx.organizationId, question);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[LIZ] query error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to answer LIZ query." },
      { status: 500 }
    );
  }
}
