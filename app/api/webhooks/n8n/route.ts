import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export const dynamic = "force-dynamic";

type N8nEventType =
  | "sms_delivered"
  | "email_delivered"
  | "call_completed"
  | "review_request_sent";

interface N8nWebhookBody {
  eventType: N8nEventType;
  executionId?: string;
  organizationId: string;
  patientId?: string;
  deliveredAt: string;
  metadata?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-zenith-webhook-secret");
  if (!secret || secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized: invalid webhook secret." },
      { status: 401 }
    );
  }

  let body: N8nWebhookBody;
  try {
    body = await req.json() as N8nWebhookBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (!body.organizationId) {
    return NextResponse.json(
      { ok: false, error: "organizationId is required." },
      { status: 400 }
    );
  }

  const evidenceId = randomUUID();
  const supabase = createServiceClient();

  if (supabase) {
    await (supabase as unknown as { from: (t: string) => { insert: (r: Record<string, unknown>) => Promise<unknown> } }).from("workflow_execution_evidence").insert({
      id: evidenceId,
      organization_id: body.organizationId,
      patient_id: body.patientId ?? null,
      source: "n8n",
      event_type: body.eventType,
      execution_id: body.executionId ?? null,
      delivered_at: body.deliveredAt,
      metadata: body.metadata ?? {},
      created_at: new Date().toISOString(),
    });
  }

  try {
    await publishRuntimeFabricEvent({
      eventKey: `n8n:${body.eventType}:${evidenceId}`,
      eventType: "trace",
      sourceSystem: "n8n",
      targetChannel: "mission_control",
      summary: `n8n delivery confirmed: ${body.eventType} for org ${body.organizationId}`,
      priority: "low",
      payload: {
        event_type: "n8n_delivery_confirmed",
        n8n_event_type: body.eventType,
        organizationId: body.organizationId,
        patientId: body.patientId,
        executionId: body.executionId,
        deliveredAt: body.deliveredAt,
        evidenceId,
        metadata: body.metadata ?? {},
      },
    });
  } catch (err) {
    console.warn("[n8n-webhook] publishRuntimeFabricEvent failed (non-blocking):", err);
  }

  return NextResponse.json({ received: true, evidenceId });
}
