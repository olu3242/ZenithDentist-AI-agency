import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { roleAtLeast } from "@/lib/rbac/roles";
import { createSupportTicket, getSupportDashboard } from "@/lib/support";
import { z } from "zod";

const CreateTicketSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
});

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId);
  if (ctx instanceof NextResponse) return ctx;

  if (!roleAtLeast(ctx.membershipRole, "read_only")) {
    return NextResponse.json({ ok: false, error: "Insufficient role." }, { status: 403 });
  }

  try {
    const dashboard = await getSupportDashboard(ctx.organizationId);
    return NextResponse.json({ ok: true, data: dashboard });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to retrieve support tickets." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId);
  if (ctx instanceof NextResponse) return ctx;

  if (!roleAtLeast(ctx.membershipRole, "staff")) {
    return NextResponse.json({ ok: false, error: "Insufficient role." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = CreateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request.", details: parsed.error.issues }, { status: 400 });
  }

  try {
    const ticket = await createSupportTicket({
      organizationId: ctx.organizationId,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      reportedBy: ctx.userId ?? undefined,
    });
    return NextResponse.json({ ok: true, data: ticket }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to create support ticket." }, { status: 500 });
  }
}
