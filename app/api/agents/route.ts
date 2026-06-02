import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  runTreatmentCoordinatorTask,
  runRecallCoordinatorTask,
  runMembershipAgentTask,
  runReviewAgentTask,
  runReferralAgentTask,
  runGrowthAgentTask,
  runComplianceAgentTask,
} from "@/lib/agents";

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

    const { data: registry } = supabase
      ? await (supabase as any).from("agent_registry").select("*")
      : { data: [] };

    const { data: metrics } = supabase
      ? await (supabase as any)
          .from("agent_metrics")
          .select("*")
          .eq("organization_id", organizationId)
      : { data: [] };

    return NextResponse.json({ ok: true, registry: registry ?? [], metrics: metrics ?? [] });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Missing organizationId" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { agentKey, patientExternalId, context } = body as {
      agentKey: string;
      patientExternalId?: string;
      context?: Record<string, unknown>;
    };

    if (!agentKey) {
      return NextResponse.json({ ok: false, error: "Missing agentKey" }, { status: 400 });
    }

    switch (agentKey) {
      case "treatment_coordinator": {
        if (!patientExternalId) return NextResponse.json({ ok: false, error: "Missing patientExternalId" }, { status: 400 });
        const result = await runTreatmentCoordinatorTask({
          organizationId,
          patientExternalId,
          treatmentFee: context?.treatmentFee as number | undefined,
          treatmentCode: context?.treatmentCode as string | undefined,
          context,
        });
        return NextResponse.json(result);
      }
      case "recall_coordinator": {
        if (!patientExternalId) return NextResponse.json({ ok: false, error: "Missing patientExternalId" }, { status: 400 });
        const monthsOverdue = (context?.monthsOverdue as number) ?? 6;
        const result = await runRecallCoordinatorTask({ organizationId, patientExternalId, monthsOverdue });
        return NextResponse.json(result);
      }
      case "membership_agent": {
        if (!patientExternalId) return NextResponse.json({ ok: false, error: "Missing patientExternalId" }, { status: 400 });
        const result = await runMembershipAgentTask({ organizationId, patientExternalId });
        return NextResponse.json(result);
      }
      case "review_agent": {
        if (!patientExternalId) return NextResponse.json({ ok: false, error: "Missing patientExternalId" }, { status: 400 });
        const result = await runReviewAgentTask({ organizationId, patientExternalId });
        return NextResponse.json(result);
      }
      case "referral_agent": {
        if (!patientExternalId) return NextResponse.json({ ok: false, error: "Missing patientExternalId" }, { status: 400 });
        const result = await runReferralAgentTask({ organizationId, patientExternalId });
        return NextResponse.json(result);
      }
      case "growth_agent": {
        const result = await runGrowthAgentTask({ organizationId });
        return NextResponse.json(result);
      }
      case "compliance_agent": {
        const result = await runComplianceAgentTask({ organizationId });
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ ok: false, error: `Unknown agentKey: ${agentKey}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
