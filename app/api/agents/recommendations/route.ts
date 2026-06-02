import { NextResponse } from "next/server";
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
    if (!supabase) return NextResponse.json({ ok: true, recommendations: [] });

    const { data, error } = await (supabase as any)
      .from("agent_recommendations")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "pending")
      .order("confidence", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, recommendations: data ?? [] });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Missing organizationId" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { id, status } = body as { id: string; status: string };

    if (!id || !status) {
      return NextResponse.json({ ok: false, error: "Missing id or status" }, { status: 400 });
    }

    if (!["actioned", "dismissed"].includes(status)) {
      return NextResponse.json({ ok: false, error: "status must be 'actioned' or 'dismissed'" }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 500 });

    const { error } = await (supabase as any)
      .from("agent_recommendations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
