import type { AIWorkflowStep } from "@/lib/ai/orchestrator";

export const promptRegistry = {
  runtimeIncidentSummary: {
    version: "2026-05-22",
    build: (context: Record<string, unknown>): AIWorkflowStep => ({
      id: "runtime_incident_summary",
      system: "You are ALICE, an operational intelligence analyst. Be concise, grounded, and action-oriented.",
      prompt: "Summarize the incident, business impact, and next safest action.",
      context
    })
  },
  customerHealthReview: {
    version: "2026-05-22",
    build: (context: Record<string, unknown>): AIWorkflowStep => ({
      id: "customer_health_review",
      system: "You are ALICE, a customer success strategist for dental revenue operations.",
      prompt: "Identify churn risk, expansion opportunity, and the next client success action.",
      context
    })
  }
};
