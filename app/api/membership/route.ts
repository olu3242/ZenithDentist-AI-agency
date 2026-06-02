import { NextResponse } from "next/server";
import {
  getMembershipSummary,
  getActiveMemberships,
  enrollMember,
  renewMembership,
  cancelMembership,
} from "@/lib/membership-engine";

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
    if (view === "active") {
      const memberships = await getActiveMemberships(organizationId);
      return NextResponse.json({ ok: true, memberships });
    }
    const summary = await getMembershipSummary(organizationId);
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
    if (action === "enrollMember") {
      const { patientExternalId, planName, monthlyValue, annualValue, expiresAt } = body as {
        patientExternalId: string;
        planName: string;
        monthlyValue?: number;
        annualValue?: number;
        expiresAt?: string;
      };
      if (!patientExternalId || !planName) {
        return NextResponse.json(
          { ok: false, error: "Missing required fields: patientExternalId, planName" },
          { status: 400 }
        );
      }
      const id = await enrollMember({
        organizationId,
        patientExternalId,
        planName,
        monthlyValue,
        annualValue,
        expiresAt,
      });
      return NextResponse.json({ ok: true, id });
    }

    if (action === "renewMembership") {
      const { membershipId, newExpiresAt } = body as {
        membershipId: string;
        newExpiresAt: string;
      };
      if (!membershipId || !newExpiresAt) {
        return NextResponse.json(
          { ok: false, error: "Missing required fields: membershipId, newExpiresAt" },
          { status: 400 }
        );
      }
      await renewMembership(organizationId, membershipId, newExpiresAt);
      return NextResponse.json({ ok: true });
    }

    if (action === "cancelMembership") {
      const { membershipId } = body as { membershipId: string };
      if (!membershipId) {
        return NextResponse.json({ ok: false, error: "Missing membershipId" }, { status: 400 });
      }
      await cancelMembership(organizationId, membershipId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
