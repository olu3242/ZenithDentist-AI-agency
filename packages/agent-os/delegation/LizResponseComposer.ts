// Agent OS — Batch 5: LizResponseComposer
// Turns an agent-os execution/delegation outcome into a short, agent-agnostic
// patient-facing string. The patient never sees MAX/IVY/FINN/etc. by name —
// LIZ is the only persona that speaks to the patient.

import type { LizDelegationOutcome } from "./LizDelegationEngine";

export function compose(result: LizDelegationOutcome): string {
  if (result.error || !result.execution) {
    return "I'm having trouble with that right now, but I've made a note and our team will follow up shortly.";
  }

  if (!result.execution.success) {
    return "I've passed this along to our team to take care of for you — you'll hear back soon.";
  }

  switch (result.intent) {
    case "schedule_appointment":
      return "I've got that handled for you — your appointment request is being processed.";
    case "cancel_appointment":
      return "Done — I've taken care of updating your appointment.";
    case "treatment_questions":
      return "I've passed your treatment question along and pulled together what I can to help.";
    case "payment_questions":
      return "I've got that handled for you — your billing question is being looked into.";
    case "insurance_questions":
      return "I've got that handled for you — your insurance question is being reviewed.";
    case "review_request":
      return "Thanks for sharing your experience — I've made sure it gets where it needs to go.";
    case "practice_report":
      return "I've put together the report you asked about.";
    case "revenue_performance":
      return "I've pulled together the performance details you asked about.";
    default:
      return "I've got that handled for you.";
  }
}

export const LizResponseComposer = { compose };
export default LizResponseComposer;
