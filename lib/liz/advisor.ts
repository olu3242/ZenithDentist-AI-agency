import "server-only";

import { z } from "zod";
import { retrieveLizKnowledge } from "@/lib/liz/knowledge";

export type LizIntent = "learn" | "assess" | "book" | "support" | "enterprise" | "workflow" | "video" | "audit" | "pricing";
export type LizEscalationPath = "sales" | "support" | "enterprise" | "none";
export type LizConversationOutcome = "Learn" | "Assess" | "Book" | "Convert";
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

export interface LizAdvisorResponse extends LizResponseV2 {
  intent: LizIntent;
  outcome: LizConversationOutcome;
  leadScore: number;
  knowledgeSources: string[];
  escalationPath: LizEscalationPath;
}

export const lizMessageSchema = z.object({
  message: z.string().min(1).max(1200)
});

const suggestedQuestions = [
  "How much revenue am I losing?",
  "How does Recall Recovery work?",
  "Can Zenith integrate with OpenDental?",
  "How does ALICE help my practice?",
  "How much does Zenith cost?",
  "How do Smart Video Journeys work?",
  "Can video improve treatment acceptance?",
  "Which patient journey should I launch?",
  "How do video journeys improve attendance?",
  "Is every automation covered by runtime audit?"
];

export function getLizAdvisorResponse(message: string): LizAdvisorResponse {
  const intent = detectIntent(message);
  const knowledge = retrieveLizKnowledge(message, 4);
  const leadScore = scoreLead(message, intent);
  const response = responseForIntent(intent);

  return {
    ...response,
    intent,
    outcome: outcomeForIntent(intent),
    leadScore,
    knowledgeSources: knowledge.map(record => record.title),
    escalationPath: response.escalation?.type ?? "none",
    suggestedQuestions: response.suggestedQuestions ?? suggestedQuestions.slice(0, 5)
  };
}

function responseForIntent(intent: LizIntent): LizResponseV2 {
  if (intent === "assess") {
    return {
      message: "The best next step is the free Practice Health Assessment. It identifies missed revenue, recall gaps, no-show losses, and automation opportunities before any strategy session.",
      actions: [
        action("start-assessment", "Start Free Assessment", "Open the revenue opportunity assessment.", "/assessment", "assessment", "primary"),
        action("view-dashboard", "Preview Dashboard", "See the executive revenue view.", "/portal", "navigation", "outline")
      ]
    };
  }

  if (intent === "book") {
    return {
      message: "Strategy sessions are best after the assessment results are available. If you already completed the assessment, you can book with the team now.",
      actions: [
        action("book-strategy", "Book Strategy Session", "Escalate to the sales team.", "/#book", "sales", "primary"),
        action("start-assessment", "Start Free Assessment", "Generate the report first.", "/assessment", "assessment", "secondary")
      ],
      escalation: { type: "sales" }
    };
  }

  if (intent === "support") {
    return {
      message: "For account, billing, PMS sync, or implementation issues, I will route you to support rather than guessing.",
      actions: [
        action("contact-support", "Contact Support", "Open the support path.", "/access-pending", "support", "primary"),
        action("open-client-portal", "Open Client Portal", "Go to the approved client portal.", "/portal", "navigation", "outline")
      ],
      escalation: { type: "support" }
    };
  }

  if (intent === "enterprise") {
    return {
      message: "For DSOs and multi-location groups, Zenith supports portfolio health, benchmarking, governance, Mission Control, and implementation playbooks.",
      actions: [
        action("enterprise-consult", "Enterprise Consultation", "Route to enterprise sales.", "/#book", "enterprise", "primary"),
        action("open-mission-control", "View Mission Control", "Review the operating model.", "/mission-control", "navigation", "outline")
      ],
      escalation: { type: "enterprise" }
    };
  }

  if (intent === "workflow") {
    return {
      message: "Zenith workflows should launch directly from recommendations, dashboards, reports, and patient records. The highest-value starting point is usually recall, no-show, treatment, review, or reactivation recovery.",
      actions: [
        workflowAction("launch-recall", "Launch Recall Recovery", "Recover overdue recall patients.", "recall_recovery"),
        workflowAction("launch-review", "Launch Review Campaign", "Generate more reviews from satisfied patients.", "review_generation"),
        workflowAction("launch-treatment", "Launch Treatment Recovery", "Follow up on unscheduled treatment.", "treatment_recovery")
      ]
    };
  }

  if (intent === "video") {
    return {
      message: "Smart Video Journeys use patient context, treatment readiness, behavioral signals, and ALICE recommendations to influence attendance, treatment acceptance, reviews, referrals, and revenue attribution.",
      actions: [
        action("open-video", "Open Video Intelligence", "Review patient video journeys.", "/portal/video", "navigation", "primary"),
        workflowAction("launch-treatment-video", "Launch Treatment Video Journey", "Use education and financing guidance to improve acceptance.", "treatment_acceptance_journey"),
        workflowAction("launch-membership-video", "Launch Membership Video Journey", "Convert eligible patients into membership plans.", "membership_enrollment_journey"),
        workflowAction("launch-review-video", "Launch Review Video", "Turn satisfied patients into public reputation growth.", "review_request_video"),
        workflowAction("launch-referral-video", "Launch Referral Video", "Turn promoters into measurable referral sources.", "referral_request_video"),
        action("view-attribution", "View Revenue Attribution", "Review influenced, recovered, and protected revenue.", "/internal/revenue-attribution", "navigation", "outline")
      ]
    };
  }

  if (intent === "audit") {
    return {
      message: "Zenith's Automation Audit Framework checks registry coverage, event emissions, queue handlers, runtime traces, replay readiness, ALICE grounding, observability, and SLA coverage before a workflow is considered production-certified.",
      actions: [
        action("open-automation-audit", "Open Automation Audit", "Review coverage and critical gaps.", "/internal/automation-audit", "navigation", "primary"),
        action("open-certification", "Open Certification Center", "Review production go-live gates.", "/internal/certification", "navigation", "secondary"),
        workflowAction("launch-recall", "Audit Recall Recovery", "Review recall workflow runtime readiness.", "recall_due")
      ]
    };
  }

  if (intent === "pricing") {
    return {
      message: "Zenith packages are deliverable-based. Revenue Recovery starts with setup and monthly operating support; AI Practice Growth adds ALICE, attribution, and executive reporting; Managed AI Operations adds dedicated SLA, incident, and custom workflow support.",
      actions: [
        action("start-assessment", "Start Free Assessment", "Estimate the opportunity before pricing discussion.", "/assessment", "assessment", "primary"),
        action("book-strategy", "Book Strategy Session", "Discuss package fit.", "/#book", "sales", "secondary")
      ],
      escalation: { type: "sales" }
    };
  }

  return {
    message: "Zenith helps dental practices recover revenue, automate recall and reviews, improve treatment follow-up, and turn operational signals into actionable workflows.",
    actions: [
      action("start-assessment", "Start Free Assessment", "Find revenue and automation opportunities.", "/assessment", "assessment", "primary"),
      action("open-revenue", "Open Revenue Recovery", "See the revenue command center.", "/portal/revenue", "navigation", "secondary"),
      workflowAction("launch-recall", "Launch Recall Recovery", "Recover overdue patients.", "recall_recovery")
    ]
  };
}

function detectIntent(message: string): LizIntent {
  const text = message.toLowerCase();
  if (matches(text, ["assessment", "roi", "losing", "lost revenue", "practice health"])) return "assess";
  if (matches(text, ["book", "call", "demo", "consult", "meeting", "strategy"])) return "book";
  if (matches(text, ["support", "help", "billing", "issue", "problem", "sync failed"])) return "support";
  if (matches(text, ["enterprise", "dso", "multi-location", "multi location", "locations"])) return "enterprise";
  if (matches(text, ["audit", "coverage", "registry", "runtime trace", "e2e", "certified", "certification"])) return "audit";
  if (matches(text, ["workflow", "launch", "recall", "review campaign", "reactivation", "no show", "treatment recovery"])) return "workflow";
  if (matches(text, ["video", "journey", "attendance", "treatment acceptance", "smart video"])) return "video";
  if (matches(text, ["price", "pricing", "cost", "package", "fee", "monthly"])) return "pricing";
  return "learn";
}

function scoreLead(message: string, intent: LizIntent) {
  const text = message.toLowerCase();
  let score = intent === "book" || intent === "pricing" ? 72 : intent === "assess" ? 64 : 45;
  if (matches(text, ["owner", "practice", "dso", "multiple locations"])) score += 10;
  if (matches(text, ["opendental", "dentrix", "eaglesoft", "stripe"])) score += 8;
  if (matches(text, ["contract", "ready", "go live", "implementation"])) score += 10;
  return Math.min(100, score);
}

function outcomeForIntent(intent: LizIntent): LizConversationOutcome {
  if (intent === "assess") return "Assess";
  if (intent === "book" || intent === "pricing" || intent === "enterprise") return "Book";
  if (intent === "workflow" || intent === "audit") return "Convert";
  return "Learn";
}

function matches(text: string, terms: string[]) {
  return terms.some(term => text.includes(term));
}

function action(
  id: string,
  label: string,
  description: string,
  href: string,
  actionType: LizActionType,
  variant: LizActionVariant
): LizAction {
  return { id, label, description, href, actionType, variant };
}

function workflowAction(id: string, label: string, description: string, workflowId: string): LizAction {
  return { id, label, description, workflowId, actionType: "workflow", variant: "primary" };
}
