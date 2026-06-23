// Agent OS — Batch 5: LizIntentEngine
// Simple keyword-based intent classifier for LIZ delegation. This is distinct
// from lib/liz/advisor.ts's marketing-funnel intent (learn/assess/book/...);
// this classifier is scoped to in-app patient delegation intents.

export type LizDelegationIntent =
  | "schedule_appointment"
  | "cancel_appointment"
  | "treatment_questions"
  | "payment_questions"
  | "insurance_questions"
  | "review_request"
  | "practice_report"
  | "revenue_performance"
  | "unknown";

export function detectIntent(message: string): LizDelegationIntent {
  const text = message.toLowerCase();

  if (matches(text, ["cancel", "reschedule", "can't make it", "cant make it", "move my appointment"])) {
    return "cancel_appointment";
  }
  if (matches(text, ["schedule", "book an appointment", "appointment", "next available", "visit"])) {
    return "schedule_appointment";
  }
  if (matches(text, ["insurance", "coverage", "claim", "deductible"])) {
    return "insurance_questions";
  }
  if (matches(text, ["pay", "payment", "bill", "invoice", "balance", "charge"])) {
    return "payment_questions";
  }
  if (matches(text, ["treatment", "procedure", "filling", "crown", "root canal", "diagnosis"])) {
    return "treatment_questions";
  }
  if (matches(text, ["review", "leave a review", "google review", "testimonial"])) {
    return "review_request";
  }
  if (matches(text, ["practice report", "executive report", "summary report", "monthly report"])) {
    return "practice_report";
  }
  if (matches(text, ["revenue", "performance", "growth numbers", "financial performance"])) {
    return "revenue_performance";
  }

  return "unknown";
}

function matches(text: string, terms: string[]): boolean {
  return terms.some(term => text.includes(term));
}
