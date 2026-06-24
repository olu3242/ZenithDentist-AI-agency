import { NextResponse } from "next/server";
import { z } from "zod";
import { executeRegisteredAutomation } from "@/lib/automation-os/registry";
import { eventTypeForAction, trackLizTelemetry } from "@/lib/liz";

const lizActionSchema = z.object({
  action: z.object({
    id: z.string().min(1).max(120),
    label: z.string().min(1).max(160),
    description: z.string().max(500).optional(),
    href: z.string().max(500).optional(),
    workflowId: z.string().max(160).optional(),
    actionType: z.enum(["navigation", "assessment", "workflow", "sales", "support", "enterprise"]),
    variant: z.enum(["primary", "secondary", "outline"])
  }),
  message: z.string().max(1200).optional(),
  sessionId: z.string().max(120).optional(),
  page: z.string().max(300).optional(),
  leadScore: z.number().min(0).max(100).optional(),
  intent: z.string().max(120).optional(),
  escalationPath: z.enum(["sales", "support", "enterprise", "none"]).optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = lizActionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid LIZ action." }, { status: 400 });

  const { action } = parsed.data;
  await trackLizTelemetry({
    eventType: eventTypeForAction(action),
    action,
    message: parsed.data.message,
    sessionId: parsed.data.sessionId,
    page: parsed.data.page,
    leadScore: parsed.data.leadScore,
    intent: parsed.data.intent,
    escalationPath: parsed.data.escalationPath,
    workflowId: action.workflowId
  });

  if (action.actionType === "workflow" && action.workflowId) {
    // Workflow execution requires an internal operator token — public callers are denied.
    const internalToken =
      (request as any).cookies?.get?.("zenith_internal_token")?.value ??
      (request.headers.get("x-internal-token") || "");
    const expectedToken = process.env.INTERNAL_ACCESS_TOKEN;
    if (!expectedToken || internalToken !== expectedToken) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }
    await executeRegisteredAutomation(action.workflowId);
  }

  return NextResponse.json({ ok: true, launchedWorkflow: action.actionType === "workflow" ? action.workflowId ?? null : null });
}
