import { NextResponse } from "next/server";
import {
  getCommercialDashboard,
  getPackages,
  getSubscriptionHealth,
  getProposals,
  createProposal,
  updateProposalStatus,
  createContract,
  signContract,
  activateSubscription,
} from "@/lib/commercial-os";

function getOrganizationId(request: Request): string | null {
  const orgId = request.headers.get("x-organization-id");
  if (orgId) return orgId;
  const { searchParams } = new URL(request.url);
  return searchParams.get("organizationId");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") ?? "dashboard";
  const organizationId = getOrganizationId(request);

  try {
    if (view === "dashboard") {
      const dashboard = await getCommercialDashboard();
      return NextResponse.json({ ok: true, dashboard });
    }

    if (view === "packages") {
      const packages = await getPackages();
      return NextResponse.json({ ok: true, packages });
    }

    if (view === "subscriptions") {
      const subscriptions = await getSubscriptionHealth();
      return NextResponse.json({ ok: true, subscriptions });
    }

    if (view === "proposals") {
      const status = searchParams.get("status") ?? undefined;
      const proposals = await getProposals({
        status,
        organizationId: organizationId ?? undefined,
      });
      return NextResponse.json({ ok: true, proposals });
    }

    // default
    const dashboard = await getCommercialDashboard();
    return NextResponse.json({ ok: true, dashboard });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const organizationId = getOrganizationId(request);
  const body = await request.json().catch(() => ({}));
  const { action, ...data } = body as Record<string, any>;

  try {
    if (action === "create_proposal") {
      const id = await createProposal(data as any);
      return NextResponse.json({ ok: true, id });
    }

    if (action === "update_proposal") {
      await updateProposalStatus(data.proposalId, data.status);
      return NextResponse.json({ ok: true });
    }

    if (action === "create_contract") {
      const id = await createContract(data as any);
      return NextResponse.json({ ok: true, id });
    }

    if (action === "sign_contract") {
      await signContract(data.contractId);
      return NextResponse.json({ ok: true });
    }

    if (action === "activate_subscription") {
      const orgId = organizationId ?? data.organizationId;
      if (!orgId) {
        return NextResponse.json(
          { ok: false, error: "Missing organizationId" },
          { status: 400 }
        );
      }
      await activateSubscription(
        orgId,
        data.contractId,
        data.packageKey,
        data.monthlyMrr
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
