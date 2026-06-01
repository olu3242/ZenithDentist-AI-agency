import "server-only";

import { executeAICompletion } from "@/lib/ai/runtime";

export interface AIWorkflowStep {
  id: string;
  system: string;
  prompt: string;
  context?: Record<string, unknown>;
}

export async function runAIWorkflow(input: { organizationId?: string | null; steps: AIWorkflowStep[]; tokenBudget?: number }) {
  const results = [];
  let consumed = 0;
  for (const step of input.steps) {
    if (input.tokenBudget && consumed >= input.tokenBudget) break;
    const result = await executeAICompletion({
      system: step.system,
      prompt: step.prompt,
      context: step.context ?? {},
      organizationId: input.organizationId
    });
    consumed += result.tokenUsage.total;
    results.push({ stepId: step.id, result });
  }
  return { results, tokenUsage: consumed };
}
