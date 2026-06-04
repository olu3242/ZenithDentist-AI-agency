import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export interface ScriptVariables {
  patient_first_name?: string;
  patient_last_name?: string;
  provider_name?: string;
  practice_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  treatment_name?: string;
  treatment_cost?: string;
  recall_months?: string;
  portal_url?: string;
  review_link?: string;
  [key: string]: string | undefined;
}

export interface RenderedScript {
  templateId: string;
  channel: string;
  renderedContent: string;
  missingVariables: string[];
}

export async function renderScript(
  organizationId: string,
  templateId: string,
  variables: ScriptVariables
): Promise<RenderedScript | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data: template } = await (supabase as any).from("script_templates").select("*")
    .eq("id", templateId).eq("is_active", true)
    .or(`organization_id.eq.${organizationId},is_global_template.eq.true`)
    .maybeSingle();
  if (!template) return null;

  let content: string = template.content_template;
  const missingVariables: string[] = [];

  const templateVars: string[] = template.variables ?? [];
  for (const varName of templateVars) {
    const val = variables[varName];
    if (val !== undefined) {
      content = content.replaceAll(`{{${varName}}}`, val);
    } else {
      missingVariables.push(varName);
    }
  }

  return { templateId, channel: template.channel, renderedContent: content, missingVariables };
}

export async function getScriptTemplates(
  organizationId: string,
  opts?: { category?: string; channel?: string }
): Promise<Array<{ id: string; name: string; category: string; channel: string; journeyType: string }>> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  let q = (supabase as any).from("script_templates")
    .select("id, template_name, category, channel, journey_type")
    .or(`organization_id.eq.${organizationId},is_global_template.eq.true`)
    .eq("is_active", true);
  if (opts?.category) q = q.eq("category", opts.category);
  if (opts?.channel) q = q.eq("channel", opts.channel);

  const { data } = await q.order("performance_score", { ascending: false, nullsFirst: false });
  return (data ?? []).map((d: Record<string, string>) => ({
    id: d.id,
    name: d.template_name,
    category: d.category,
    channel: d.channel,
    journeyType: d.journey_type,
  }));
}

export async function createScriptTemplate(opts: {
  organizationId: string;
  templateName: string;
  journeyType: string;
  category: string;
  channel: string;
  contentTemplate: string;
  variables: string[];
}): Promise<{ id: string }> {
  const supabase = createServiceClient();
  if (!supabase) return { id: "" };
  const { data } = await (supabase as any).from("script_templates").insert({
    organization_id: opts.organizationId,
    template_name: opts.templateName,
    journey_type: opts.journeyType,
    category: opts.category,
    channel: opts.channel,
    content_template: opts.contentTemplate,
    variables: opts.variables,
  }).select("id").single();
  return { id: data?.id ?? "" };
}

export async function recordScriptPerformance(
  organizationId: string,
  templateId: string,
  event: 'sent' | 'opened' | 'clicked' | 'converted'
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;
  const today = new Date();
  const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const col = event === 'sent' ? 'total_sent'
    : event === 'opened' ? 'total_opened'
    : event === 'clicked' ? 'total_clicked'
    : 'conversion_count';

  const { data: existing } = await (supabase as any).from("script_analytics")
    .select("id, total_sent, total_opened, total_clicked, conversion_count")
    .eq("organization_id", organizationId).eq("script_template_id", templateId)
    .eq("period_start", periodStart).maybeSingle();

  if (existing) {
    await (supabase as any).from("script_analytics")
      .update({ [col]: (existing[col] ?? 0) + 1 }).eq("id", existing.id);
  } else {
    await (supabase as any).from("script_analytics").insert({
      organization_id: organizationId,
      script_template_id: templateId,
      period_start: periodStart,
      period_end: periodEnd,
      [col]: 1,
    });
  }
}
