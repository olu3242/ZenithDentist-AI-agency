import "server-only";

import { z } from "zod";
import { env } from "@/lib/env";
import { retrieveLizKnowledge, type LizKnowledgeRecord } from "@/lib/liz/knowledge";

export type LizIntent = "product_question" | "assessment_interest" | "booking_interest" | "enterprise_interest" | "support_request" | "pricing_question" | "guardrail_blocked" | "unknown";
export type LizEscalationPath = "sales" | "support" | "enterprise" | "none";
export type LizConversationOutcome = "learn" | "assess" | "book" | "convert";
export type LizActionType = "navigation" | "assessment" | "workflow" | "sales" | "support" | "enterprise";
export type LizActionVariant = "primary" | "secondary" | "outline";

export interface LizAction {
  id: string;
  label: string;
  description?: string;
  href?: string;
  workflowId?: string;
  actionType: LizActionType;
  variant: LizActionVariant;
}

export interface LizResponseV2 {
  message: string;
  actions?: LizAction[];
  suggestedQuestions?: string[];
  escalation?: {
    type: "sales" | "support" | "enterprise";
  };
}

export const lizMessageSchema = z.object({
  message: z.string().min(1).max(1200),
  context: z.object({
    page: z.string().max(300).optional(),
    email: z.string().email().optional(),
    practiceName: z.string().max(160).optional()
  }).optional()
});

export interface LizAdvisorResponse {
  answer: string;
  message: string;
  intent: LizIntent;
  leadScore: number;
  recommendedOutcome: LizConversationOutcome;
  escalationPath: LizEscalationPath;
  citations: Array<{ title: string; source: LizKnowledgeRecord["source"] }>;
  suggestedActions: Array<{ label: string; href: string }>;
  actions: LizAction[];
  suggestedQuestions: string[];
  escalation?: { type: "sales" | "support" | "enterprise" };
  guardrail: { blocked: boolean; reason?: string };
}

const guardrails = [
  { reason: "medical advice", pattern: /\b(diagnose|diagnosis|treat disease|medical advice|clinical advice|prescribe|symptom)\b/i },
  { reason: "legal advice", pattern: /\b(legal advice|lawsuit|attorney|contract interpretation|liable|liability)\b/i },
  { reason: "financial guarantee", pattern: /\b(guarantee|guaranteed|promise profit|certain roi|risk-free return)\b/i },
  { reason: "system secrets", pattern: /\b(api key|secret|password|token|service role|env var|database credential)\b/i },
  { reason: "prompt disclosure", pattern: /\b(system prompt|developer message|hidden instructions|prompt injection|show your prompt)\b/i }
];

export function getLizAdvisorResponse(message: string): LizAdvisorResponse {
  const guardrail = evaluateGuardrails(message);
  if (guardrail.blocked) {
    return {
      answer: `I cannot help with ${guardrail.reason}. I can explain Zenith capabilities, route you to support, or help you start the free revenue opportunity assessment.`,
      message: `I cannot help with ${guardrail.reason}. I can explain Zenith capabilities, route you to support, or help you start the free revenue opportunity assessment.`,
      intent: "guardrail_blocked",
      leadScore: 0,
      recommendedOutcome: "learn",
      escalationPath: guardrail.reason === "system secrets" || guardrail.reason === "prompt disclosure" ? "support" : "none",
      citations: [],
      suggestedActions: legacyActions([assessmentAction("guardrail-assessment"), supportAction("guardrail-support")]),
      actions: [assessmentAction("guardrail-assessment"), supportAction("guardrail-support")],
      suggestedQuestions: defaultSuggestedQuestions("guardrail_blocked"),
      escalation: guardrail.reason === "system secrets" || guardrail.reason === "prompt disclosure" ? { type: "support" } : undefined,
      guardrail
    };
  }

  const intent = detectIntent(message);
  const retrieved = retrieveLizKnowledge(message, 5);
  const leadScore = scoreLead(message, intent);
  const escalationPath = chooseEscalation(message, intent, leadScore);
  const recommendedOutcome = chooseOutcome(intent, escalationPath, leadScore);
  const answer = composeAnswer(message, intent, retrieved, escalationPath);
  const actions = actionsFor(intent, escalationPath, leadScore, message);

  return {
    answer,
    message: answer,
    intent,
    leadScore,
    recommendedOutcome,
    escalationPath,
    citations: retrieved.slice(0, 3).map(record => ({ title: record.title, source: record.source })),
    suggestedActions: legacyActions(actions),
    actions,
    suggestedQuestions: defaultSuggestedQuestions(intent),
    escalation: escalationPath === "none" ? undefined : { type: escalationPath },
    guardrail: { blocked: false }
  };
}

function evaluateGuardrails(message: string) {
  const matched = guardrails.find(rule => rule.pattern.test(message));
  return matched ? { blocked: true, reason: matched.reason } : { blocked: false as const };
}

function detectIntent(message: string): LizIntent {
  const text = message.toLowerCase();
  if (/\b(help|support|issue|broken|bug|billing|login|sync not working|error)\b/.test(text)) return "support_request";
  if (/\b(dso|enterprise|multi-location|multiple locations|portfolio|group practice)\b/.test(text)) return "enterprise_interest";
  if (/\b(book|call|demo|meeting|strategy session|speak|talk)\b/.test(text)) return "booking_interest";
  if (/\b(assessment|audit|score|roi|revenue opportunity|practice health)\b/.test(text)) return "assessment_interest";
  if (/\b(price|pricing|cost|plan|subscription)\b/.test(text)) return "pricing_question";
  if (/\b(product|workflow|automation|recall|review|referral|no-show|treatment|membership|video|journey|attention score|patient influence|pms|alice|mission control)\b/.test(text)) return "product_question";
  return "unknown";
}

function scoreLead(message: string, intent: LizIntent) {
  const text = message.toLowerCase();
  let score = 15;
  if (intent === "assessment_interest") score += 30;
  if (intent === "booking_interest") score += 45;
  if (intent === "enterprise_interest") score += 50;
  if (intent === "pricing_question") score += 25;
  if (/\b(no-show|recall|reviews|treatment|revenue|growth|automation|pms)\b/.test(text)) score += 15;
  if (/\b(urgent|this month|ready|need|evaluate|compare|implementation)\b/.test(text)) score += 10;
  if (/\b(2 locations|3 locations|4 locations|5 locations|multi-location|dso|enterprise)\b/.test(text)) score += 15;
  if (intent === "support_request") score = 5;
  return Math.max(0, Math.min(100, score));
}

function chooseEscalation(message: string, intent: LizIntent, leadScore: number): LizEscalationPath {
  if (intent === "support_request") return "support";
  if (intent === "enterprise_interest") return "enterprise";
  if (intent === "booking_interest" || leadScore >= 70) return "sales";
  return "none";
}

function chooseOutcome(intent: LizIntent, escalationPath: LizEscalationPath, leadScore: number): LizConversationOutcome {
  if (escalationPath === "enterprise" || leadScore >= 85) return "convert";
  if (escalationPath === "sales" || intent === "booking_interest") return "book";
  if (intent === "assessment_interest" || leadScore >= 45) return "assess";
  return "learn";
}

function composeAnswer(message: string, intent: LizIntent, records: LizKnowledgeRecord[], escalationPath: LizEscalationPath) {
  const top = records[0];
  const grounding = records.length
    ? records.slice(0, 3).map(record => `${record.title}: ${record.body}`).join("\n")
    : "Zenith is a Patient Revenue Operating System for recall, no-show, treatment, review, referral, workflow automation, ALICE recommendations, and Mission Control.";
  const prefix = intent === "support_request"
    ? "That sounds like a support issue."
    : intent === "enterprise_interest"
      ? "For multi-location or DSO teams, Zenith is designed around enterprise mission control, benchmarking, and portfolio visibility."
      : intent === "assessment_interest"
        ? "The best next step is the free Revenue Opportunity Assessment."
        : "Here is the grounded answer from Zenith's product model.";
  const escalation = escalationPath === "sales"
    ? "I can route this to a strategy session after you review assessment results."
    : escalationPath === "enterprise"
      ? "This should go to the enterprise path so location count, PMS mix, governance, and rollout scope are reviewed."
      : escalationPath === "support"
        ? "I recommend routing this to support with the account and issue details."
        : "You can keep exploring or start the assessment when ready.";

  return `${prefix}\n\n${top ? top.body : grounding}\n\n${escalation}\n\nI do not provide medical, legal, or guaranteed financial advice, but I can explain Zenith capabilities and recommend the right workflow or next step.`;
}

function actionsFor(intent: LizIntent, escalationPath: LizEscalationPath, leadScore: number, message: string): LizAction[] {
  if (escalationPath === "support") return [supportAction("support-escalation"), navigationAction("support-faq", "Read FAQ", "/#faq", "Review product and support answers.", "outline")];
  if (escalationPath === "enterprise") return [enterpriseAction("enterprise-consultation"), assessmentAction("enterprise-assessment"), navigationAction("mission-control", "Open Mission Control", "/dashboard/mission-control", "See the enterprise operating surface.", "outline")];
  if (escalationPath === "sales" || intent === "booking_interest") return [assessmentAction("sales-assessment"), salesAction("strategy-session"), navigationAction("reports", "Review Strategy Path", "/dashboard/reports", "See reporting and strategy outputs.", "outline")];

  const workflowActions = workflowActionsFor(message, intent);
  if (intent === "assessment_interest" || leadScore >= 45) return [assessmentAction("assessment-start"), ...workflowActions.slice(0, 2)];
  if (workflowActions.length) return [workflowActions[0], ...workflowActions.slice(1, 3), assessmentAction("workflow-assessment", "Get My Free Assessment", "Use the assessment to quantify the opportunity before implementation.")];
  return [
    navigationAction("open-revenue-recovery", "Open Revenue Recovery", "/dashboard/revenue", "Explore revenue opportunities and recovery workflows.", "primary"),
    assessmentAction("default-assessment"),
    navigationAction("read-faq", "Read FAQ", "/#faq", "Get quick answers about Zenith.", "outline")
  ];
}

function workflowActionsFor(message: string, intent: LizIntent): LizAction[] {
  const text = message.toLowerCase();
  const actions: LizAction[] = [];
  if (/\b(recall|hygiene|overdue)\b/.test(text)) actions.push(workflowAction("recall-recovery", "Launch Recall Recovery", "recall_due", "/dashboard/recall", "Recover overdue recall patients."));
  if (/\b(video|journey|attention score|patient influence|analytics)\b/.test(text)) actions.push(workflowAction("video-analytics", "View Video Analytics", "video_confirmation", "/portal/video", "Open Video Intelligence Center."));
  if (/\b(video campaign|launch video)\b/.test(text)) actions.push(workflowAction("video-campaign", "Launch Video Campaign", "video_confirmation", "/portal/video", "Launch a patient journey video campaign."));
  if (/\b(recall journey|recall video)\b/.test(text)) actions.push(workflowAction("video-recall", "Launch Recall Journey", "video_recall", "/portal/video", "Launch the recall patient journey."));
  if (/\b(membership|membership journey)\b/.test(text)) actions.push(workflowAction("video-membership", "Launch Membership Journey", "video_membership", "/portal/video", "Launch the membership enrollment journey."));
  if (/\b(review|reputation|google)\b/.test(text)) actions.push(workflowAction("review-campaign", "Launch Review Campaign", "review_request_due", "/dashboard/reviews", "Start review generation workflow."));
  if (/\b(review campaign|review video)\b/.test(text)) actions.push(workflowAction("video-review", "Launch Review Campaign", "video_review_request", "/portal/video", "Launch review growth video journey."));
  if (/\b(treatment|case acceptance|unscheduled)\b/.test(text)) actions.push(workflowAction("treatment-recovery", "Launch Treatment Recovery", "treatment_recovery", "/dashboard/revenue", "Recover unscheduled treatment opportunity."));
  if (/\b(treatment video|treatment acceptance|root canal|implant)\b/.test(text)) actions.push(workflowAction("video-treatment", "Recommend Next Best Journey", "video_treatment_acceptance", "/portal/video", "Recommend the right treatment acceptance journey."));
  if (/\b(reactivation|inactive|dormant)\b/.test(text)) actions.push(workflowAction("reactivation", "Launch Reactivation Campaign", "reactivation_candidate_detected", "/dashboard/recall", "Reactivate dormant patients."));
  if (/\b(lead|nurture|prospect)\b/.test(text)) actions.push(workflowAction("lead-nurture", "Launch Lead Nurture", "lead_created", "/dashboard/workflows", "Nurture inbound leads and assessment requests."));
  if (/\b(referral|promoter)\b/.test(text)) actions.push(workflowAction("referral-campaign", "Launch Referral Campaign", "referral_growth", "/dashboard/reviews", "Turn promoters into referral sources."));
  if (/\b(referral campaign|referral video)\b/.test(text)) actions.push(workflowAction("video-referral", "Launch Referral Campaign", "video_referral_request", "/portal/video", "Launch referral growth video journey."));
  if (/\b(no-show|no show|missed appointment|chair fill)\b/.test(text)) actions.push(workflowAction("no-show-recovery", "Launch No Show Recovery", "appointment_no_show", "/dashboard/revenue", "Recover missed appointments and protect chair time."));
  if (!actions.length && intent === "product_question") actions.push(workflowAction("revenue-opportunity", "Open Revenue Recovery", "alice_revenue_opportunity_agent", "/dashboard/revenue", "Let ALICE prioritize the highest revenue opportunity."));
  return actions;
}

function assessmentAction(id: string, label = "Start Free Assessment", description = "Open the revenue opportunity assessment before booking a strategy session."): LizAction {
  return { id, label, description, href: "/assessment", actionType: "assessment", variant: "primary" };
}

function salesAction(id: string): LizAction {
  return { id, label: "Book Strategy Session", description: "Schedule a strategy session after assessment context is reviewed.", href: env.CALENDLY_URL || "/#assessment", actionType: "sales", variant: "secondary" };
}

function supportAction(id: string): LizAction {
  return { id, label: "Contact Support", description: "Route account, billing, sync, or product issues to support.", href: "mailto:support@zenithpros.com", actionType: "support", variant: "primary" };
}

function enterpriseAction(id: string): LizAction {
  return { id, label: "Enterprise Consultation", description: "Route DSO or multi-location opportunities to the enterprise path.", href: env.CALENDLY_URL || "/#assessment", actionType: "enterprise", variant: "primary" };
}

function workflowAction(id: string, label: string, workflowId: string, href: string, description: string): LizAction {
  return { id, label, description, href, workflowId, actionType: "workflow", variant: "primary" };
}

function navigationAction(id: string, label: string, href: string, description: string, variant: LizActionVariant): LizAction {
  return { id, label, description, href, actionType: "navigation", variant };
}

function legacyActions(actions: LizAction[]) {
  return actions.filter(action => action.href).map(action => ({ label: action.label, href: action.href ?? "/" }));
}

function defaultSuggestedQuestions(intent: LizIntent) {
  if (intent === "support_request") return ["Can you help with PMS sync issues?", "How do I contact support?", "Where can I see workflow errors?"];
  if (intent === "enterprise_interest") return ["How does DSO Mission Control work?", "Can Zenith compare locations?", "How does enterprise rollout work?"];
  if (intent === "assessment_interest") return ["How much revenue am I losing?", "What does the Practice Health Score include?", "What happens after the assessment?"];
  if (intent === "pricing_question") return ["How much does Zenith cost?", "Which plan includes Mission Control?", "Can I start with recall recovery?"];
  return [
    "How much revenue am I losing?",
    "How does Recall Recovery work?",
    "How do video journeys improve attendance?",
    "Which patient journey should I launch?",
    "Can Zenith integrate with OpenDental?",
    "How does ALICE help my practice?",
    "How much does Zenith cost?"
  ];
}
