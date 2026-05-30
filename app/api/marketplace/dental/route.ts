import { NextRequest, NextResponse } from "next/server";
import { EXTENSION_REGISTRY } from "@/lib/marketplace-core/extension-registry";
import { extensionTriggerWorkflow } from "@/lib/marketplace-core/extension-runtime";
import type { WorkflowTrigger } from "@/lib/workflow-os/workflow-router";

export const dynamic = "force-dynamic";

/** GET /api/marketplace/dental — returns all automation_pack blueprints */
export async function GET() {
  const dental = EXTENSION_REGISTRY.filter(e => e.category === "automation_pack");
  return NextResponse.json({ ok: true, count: dental.length, extensions: dental });
}

/** POST /api/marketplace/dental — deploy a dental blueprint for an organization */
export async function POST(req: NextRequest) {
  let body: { extensionId?: string; organizationId?: string };
  try {
    body = await req.json() as { extensionId?: string; organizationId?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { extensionId, organizationId } = body;
  if (!extensionId || !organizationId) {
    return NextResponse.json(
      { ok: false, error: "extensionId and organizationId are required" },
      { status: 400 },
    );
  }

  const extension = EXTENSION_REGISTRY.find(e => e.id === extensionId && e.category === "automation_pack");
  if (!extension) {
    return NextResponse.json(
      { ok: false, error: `Dental blueprint "${extensionId}" not found` },
      { status: 404 },
    );
  }

  const trigger = extension.workflowIds[0] as WorkflowTrigger;
  if (!trigger) {
    return NextResponse.json(
      { ok: false, error: `Blueprint "${extensionId}" has no workflow configured` },
      { status: 422 },
    );
  }

  try {
    const result = await extensionTriggerWorkflow({
      extensionId,
      organizationId,
      trigger,
      payload: { source: "marketplace_deploy", blueprintId: extensionId },
    });

    return NextResponse.json({
      ok: true,
      extensionId,
      organizationId,
      trigger,
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
