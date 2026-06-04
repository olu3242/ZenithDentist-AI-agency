import { renderVariables, type TemplateVariables } from "@/lib/templates/variable-engine";

export function renderTemplate(input: { subject?: string | null; body: string; variables: TemplateVariables }) {
  return {
    subject: input.subject ? renderVariables(input.subject, input.variables) : undefined,
    body: renderVariables(input.body, input.variables)
  };
}
