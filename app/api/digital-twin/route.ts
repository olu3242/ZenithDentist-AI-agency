import { NextResponse } from "next/server";
import {
  getDigitalTwinDashboard,
  getPracticeTwin,
  getForecastTwin,
  getWorkflowTwin,
  simulateRevenueTwin,
  getPatientTwinScores,
} from "@/lib/digital-twin";

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
  const view = searchParams.get("view") ?? "dashboard";

  try {
    switch (view) {
      case "dashboard":
        return NextResponse.json({ ok: true, data: await getDigitalTwinDashboard(organizationId) });
      case "practice":
        return NextResponse.json({ ok: true, data: await getPracticeTwin(organizationId) });
      case "forecast":
        return NextResponse.json({ ok: true, data: await getForecastTwin(organizationId) });
      case "workflow":
        return NextResponse.json({ ok: true, data: await getWorkflowTwin(organizationId) });
      default:
        return NextResponse.json({ ok: true, data: await getDigitalTwinDashboard(organizationId) });
    }
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
  const action: string = body.action ?? "";

  try {
    switch (action) {
      case "simulate_revenue": {
        const result = await simulateRevenueTwin(organizationId, body.inputs ?? {});
        return NextResponse.json({ ok: true, data: result });
      }
      case "get_patient_scores": {
        if (!body.patientExternalId) {
          return NextResponse.json(
            { ok: false, error: "Missing patientExternalId" },
            { status: 400 }
          );
        }
        const result = await getPatientTwinScores(organizationId, body.patientExternalId);
        return NextResponse.json({ ok: true, data: result });
      }
      default:
        return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
