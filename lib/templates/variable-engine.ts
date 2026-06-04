import { templateVariables } from "@/lib/templates/template-registry";

export type TemplateVariables = Partial<Record<typeof templateVariables[number], string | number>>;

export function extractVariables(template: string) {
  return [...template.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)].map(match => match[1]);
}

export function validateVariables(template: string, variables: TemplateVariables) {
  const required = extractVariables(template);
  const missing = required.filter(key => variables[key as keyof TemplateVariables] == null || variables[key as keyof TemplateVariables] === "");
  return { valid: missing.length === 0, missing };
}

export function renderVariables(template: string, variables: TemplateVariables) {
  const validation = validateVariables(template, variables);
  if (!validation.valid) throw new Error(`Missing template variables: ${validation.missing.join(", ")}`);
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key) => String(variables[key as keyof TemplateVariables] ?? ""));
}
