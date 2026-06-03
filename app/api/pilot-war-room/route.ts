import { NextResponse } from "next/server";
import {
  getWarRoomDashboard,
  initializePilotScorecard,
  recordDailyMetrics,
  markMilestone,
  generateRoiReport,
  snapshotAlicePerformance,
  type PilotScorecard,
  type DailyMetrics,
} from "@/lib/pilot-war-room";

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
    const dashboard = await getWarRoomDashboard(organizationId);
    return NextResponse.json({ ok: true, dashboard });
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
    tier?: string;
    metrics?: Partial<DailyMetrics>;
    milestone?: keyof PilotScorecard["milestones"];
    period?: "7d" | "30d" | "60d" | "90d";
  };

  try {
    switch (body.action) {
      case "init_scorecard": {
        const scorecard = await initializePilotScorecard(organizationId, body.tier);
        return NextResponse.json({ ok: true, scorecard });
      }
      case "record_metrics": {
        const today = new Date().toISOString().split("T")[0];
        recordDailyMetrics({
          organizationId,
          metricDate: today,
          patientsEngaged: 0,
          videosDelivered: 0,
          videosWatched: 0,
          watchRate: 0,
          appointmentsConfirmed: 0,
          recallRecovered: 0,
          reviewsGenerated: 0,
          referralsGenerated: 0,
          membershipEnrollments: 0,
          treatmentAccepted: 0,
          revenueInfluenced: 0,
          revenueRecovered: 0,
          aliceRecommendations: 0,
          journeysStarted: 0,
          journeysCompleted: 0,
          ...body.metrics,
        });
        return NextResponse.json({ ok: true });
      }
      case "mark_milestone": {
        if (!body.milestone) {
          return NextResponse.json({ ok: false, error: "Missing milestone" }, { status: 400 });
        }
        markMilestone(organizationId, body.milestone);
        return NextResponse.json({ ok: true });
      }
      case "generate_roi": {
        const report = await generateRoiReport(organizationId, body.period ?? "30d");
        return NextResponse.json({ ok: true, report });
      }
      case "snapshot_alice": {
        snapshotAlicePerformance(organizationId);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
