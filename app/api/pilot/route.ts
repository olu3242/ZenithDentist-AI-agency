import { NextResponse } from "next/server";
import { calculateClientHealthScore, getImplementationStatus } from "@/lib/client-success";
import { getAliceAccuracyMetrics, reconcileAliceDecisions } from "@/lib/alice/outcome-reconciliation";
import { scheduleJourneySteps } from "@/lib/journey-scheduler";
import { createServiceClient } from "@/lib/supabase/server";

function getOrganizationId(request: Request): string | null {
  const orgId = request.headers.get("x-organization-id");
  if (orgId) return orgId;
  const { searchParams } = new URL(request.url);
  return searchParams.get("organizationId");
}

export async function GET(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Missing organizationId" }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const [clientHealthScore, implementationStatus, aliceAccuracyMetrics] = await Promise.all([
      calculateClientHealthScore(organizationId),
      getImplementationStatus(organizationId),
      getAliceAccuracyMetrics(organizationId),
    ]);

    let pilotEvents: unknown[] = [];
    if (supabase) {
      const { data } = await (supabase as any)
        .from("pilot_health_events")
        .select("*")
        .eq("organization_id", organizationId)
        .order("occurred_at", { ascending: false })
        .limit(20);
      pilotEvents = data ?? [];
    }

    return NextResponse.json({
      ok: true,
      clientHealthScore,
      implementationStatus,
      pilotEvents,
      aliceAccuracyMetrics,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Missing organizationId" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({})) as {
    action?: string;
    assignmentId?: string;
  };

  try {
    if (body.action === "calculate_health") {
      const score = await calculateClientHealthScore(organizationId);
      return NextResponse.json({ ok: true, score });
    }

    if (body.action === "reconcile_alice") {
      const result = await reconcileAliceDecisions(organizationId);
      return NextResponse.json({ ok: true, ...result });
    }

    if (body.action === "schedule_journey_steps") {
      if (!body.assignmentId) {
        return NextResponse.json({ ok: false, error: "Missing assignmentId" }, { status: 400 });
      }
      const steps = await scheduleJourneySteps(organizationId, body.assignmentId);
      return NextResponse.json({ ok: true, steps });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
