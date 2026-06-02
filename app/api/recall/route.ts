import { NextResponse } from "next/server";
import {
  getRecallSummary,
  getOverduePatients,
  addRecallPatient,
  markRecallContacted,
  markRecallScheduled,
  markRecallRecovered,
} from "@/lib/recall-engine";

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
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");
  try {
    if (view === "overdue") {
      const minMonths = parseFloat(searchParams.get("minMonths") ?? "0") || 0;
      const patients = await getOverduePatients(organizationId, minMonths);
      return NextResponse.json({ ok: true, patients });
    }
    const summary = await getRecallSummary(organizationId);
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Missing organizationId" }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const { action } = body as { action?: string };

  try {
    if (action === "addRecallPatient") {
      const { patientExternalId, lastVisitDate, workflowId } = body as {
        patientExternalId: string;
        lastVisitDate: string;
        workflowId?: string;
      };
      if (!patientExternalId || !lastVisitDate) {
        return NextResponse.json(
          { ok: false, error: "Missing required fields: patientExternalId, lastVisitDate" },
          { status: 400 }
        );
      }
      const id = await addRecallPatient({
        organizationId,
        patientExternalId,
        lastVisitDate,
        workflowId,
      });
      return NextResponse.json({ ok: true, id });
    }

    if (action === "markRecallContacted") {
      const { recallId } = body as { recallId: string };
      if (!recallId) {
        return NextResponse.json({ ok: false, error: "Missing recallId" }, { status: 400 });
      }
      await markRecallContacted(organizationId, recallId);
      return NextResponse.json({ ok: true });
    }

    if (action === "markRecallScheduled") {
      const { recallId } = body as { recallId: string };
      if (!recallId) {
        return NextResponse.json({ ok: false, error: "Missing recallId" }, { status: 400 });
      }
      await markRecallScheduled(organizationId, recallId);
      return NextResponse.json({ ok: true });
    }

    if (action === "markRecallRecovered") {
      const { recallId, revenueAttributed } = body as {
        recallId: string;
        revenueAttributed?: number;
      };
      if (!recallId) {
        return NextResponse.json({ ok: false, error: "Missing recallId" }, { status: 400 });
      }
      await markRecallRecovered(organizationId, recallId, revenueAttributed);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
