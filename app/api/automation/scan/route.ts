import { NextRequest, NextResponse } from "next/server";
import { runAllDetectors } from "@/lib/automation/detectors";
import { logger } from "@/lib/logger";

export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const headerToken = request.headers.get("x-internal-token") ?? "";
  const bearer = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const internalToken = process.env.ZENITH_INTERNAL_TOKEN;
  const cronSecret = process.env.CRON_SECRET;
  if (internalToken && (headerToken === internalToken || bearer === internalToken)) return true;
  if (cronSecret && bearer === cronSecret) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const startedAt = Date.now();
  const results = await runAllDetectors();
  const triggered = results.filter(result => result.triggered);
  const failed = results.filter(result => result.error);

  logger.info("automation_scan_completed", {
    durationMs: Date.now() - startedAt,
    detectorsRun: results.length,
    workflowsTriggered: triggered.length,
    failures: failed.length
  });

  return NextResponse.json({
    ok: failed.length === 0,
    durationMs: Date.now() - startedAt,
    results
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
