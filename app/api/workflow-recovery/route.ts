import { NextResponse } from "next/server";
import {
  detectWorkflowFailure,
  attemptRecovery,
  getRecoveryMetrics,
  getActiveIncidents,
} from "@/lib/workflow-recovery";
import type { RecoveryEvent } from "@/lib/workflow-recovery";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");
  const organizationId = searchParams.get("organizationId") ?? undefined;

  try {
    if (view === "metrics") {
      const metrics = await getRecoveryMetrics(organizationId);
      return NextResponse.json({ ok: true, metrics });
    }

    if (view === "incidents") {
      const incidents = await getActiveIncidents(organizationId);
      return NextResponse.json({ ok: true, incidents });
    }

    const [metrics, incidents] = await Promise.all([
      getRecoveryMetrics(organizationId),
      getActiveIncidents(organizationId),
    ]);
    return NextResponse.json({ ok: true, metrics, incidents });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const action = body.action as string | undefined;

  try {
    if (action === "detect_failure") {
      const event: RecoveryEvent = {
        organizationId: body.organizationId as string | undefined,
        workflowId: body.workflowId as string,
        failureType: body.failureType as RecoveryEvent["failureType"],
        severity: body.severity as RecoveryEvent["severity"],
        diagnosis: body.diagnosis as string | undefined,
      };
      const id = await detectWorkflowFailure(event);
      return NextResponse.json({ ok: true, recoveryEventId: id });
    }

    if (action === "attempt_recovery") {
      const succeeded = await attemptRecovery(
        body.recoveryEventId as string,
        body.actionType as Parameters<typeof attemptRecovery>[1]
      );
      return NextResponse.json({ ok: true, succeeded });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
