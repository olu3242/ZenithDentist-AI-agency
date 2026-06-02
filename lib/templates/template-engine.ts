import "server-only";

import type { Json } from "@/lib/database.types";
import { produceEvidence } from "@/lib/evidence/evidence-producer";
import { routeChannel } from "@/lib/templates/channel-router";
import { renderTemplate } from "@/lib/templates/template-renderer";
import type { MessageChannel } from "@/lib/templates/template-registry";
import type { TemplateVariables } from "@/lib/templates/variable-engine";
import { createServiceClient } from "@/lib/supabase/server";

export async function renderMessageTemplate(input: { organizationId: string; templateKey: string; channel: MessageChannel; variables: TemplateVariables; patientId?: string; traceId: string }) {
  const supabase = createServiceClient();
  const routed = routeChannel(input.channel);
  if (!supabase) throw new Error("Template rendering requires Supabase service configuration.");
  const { data, error } = await (supabase as any)
    .from("message_templates")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("template_key", input.templateKey)
    .eq("channel", input.channel)
    .maybeSingle();
  if (error) throw new Error(`Unable to load message template: ${error.message}`);
  if (!data) throw new Error(`Message template not found: ${input.templateKey}/${input.channel}`);
  const rendered = renderTemplate({ subject: data.subject, body: data.body, variables: input.variables });
  await produceEvidence({
    type: routed.evidenceType,
    organizationId: input.organizationId,
    traceId: input.traceId,
    patientId: input.patientId,
    actor: "template_engine",
    source: "communication_template_os",
    action: "template_rendered",
    outcome: "ready_to_send",
    metadata: { template_key: input.templateKey, channel: input.channel, variables: input.variables as Json }
  });
  return { ...rendered, channel: input.channel, deliveryOwner: routed.deliveryOwner };
}
