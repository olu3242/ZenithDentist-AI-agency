import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { executeReplay } from "@/lib/runtime/replay-engine";
import { createReplayRequest } from "@/lib/stability";

export async function POST(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json().catch(() => ({}));
  if (typeof body.traceId === "string") {
    const replay = await executeReplay({
      traceId: body.traceId,
      dryRun: body.dryRun !== false,
      approved: body.approved === true,
      reason: typeof body.reason === "string" ? body.reason : undefined
    });
    return NextResponse.json(replay);
  }

  const replay = await createReplayRequest({
    replayScope: typeof body.replayScope === "string" ? body.replayScope : undefined,
    targetPipeline: typeof body.targetPipeline === "string" ? body.targetPipeline : undefined,
    reason: typeof body.reason === "string" ? body.reason : undefined,
    sourceQueueEventId: typeof body.sourceQueueEventId === "string" ? body.sourceQueueEventId : null
  });
  return NextResponse.json(replay);
}
