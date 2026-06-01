import "server-only";

import { workflowCatalog } from "@/lib/action-engine";
import { automationRegistry } from "@/lib/automation/registry";
import { PRODUCT_CATALOG } from "@/lib/platform-core/product-catalog";

export type LizKnowledgeSource = "product_catalog" | "workflow_catalog" | "automation_catalog" | "roi_framework" | "faq_library";

export interface LizKnowledgeRecord {
  id: string;
  source: LizKnowledgeSource;
  title: string;
  body: string;
  tags: string[];
}

export const lizFaqLibrary: LizKnowledgeRecord[] = [
  {
    id: "faq-pms-replacement",
    source: "faq_library",
    title: "Does Zenith replace our PMS?",
    body: "No. Zenith sits beside systems like Dentrix, Eaglesoft, OpenDental, Curve, or scheduler exports. It reads operational signals and launches revenue, recall, review, and workflow automations around the PMS.",
    tags: ["pms", "integration", "dentrix", "eaglesoft", "opendental", "replace"]
  },
  {
    id: "faq-after-assessment",
    source: "faq_library",
    title: "What happens after the assessment?",
    body: "The free assessment generates a Practice Health and revenue opportunity view. After results, the prospect can review the report and book a strategy session.",
    tags: ["assessment", "roi", "report", "strategy", "book"]
  },
  {
    id: "faq-patient-data",
    source: "faq_library",
    title: "Is Zenith production-ready for patient data?",
    body: "Zenith has tenant-aware architecture, validation, RLS-ready tables, runtime tracing, and governance scaffolds. Any HIPAA-grade deployment still requires a signed compliance path, vendor review, and configured production controls.",
    tags: ["security", "hipaa", "patient", "compliance", "data"]
  },
  {
    id: "faq-results",
    source: "faq_library",
    title: "Does Zenith guarantee revenue results?",
    body: "No. Zenith models revenue opportunity and tracks recovered outcomes, but it does not guarantee financial results. Outcomes depend on data quality, workflow setup, staff follow-through, and market conditions.",
    tags: ["guarantee", "revenue", "financial", "results", "roi"]
  },
  {
    id: "faq-enterprise",
    source: "faq_library",
    title: "Does Zenith support DSOs and multi-location groups?",
    body: "Yes. Zenith includes enterprise mission control concepts, location benchmarking, portfolio health, governance, and multi-location operating views.",
    tags: ["dso", "enterprise", "multi-location", "portfolio", "locations"]
  },
  {
    id: "faq-support",
    source: "faq_library",
    title: "Where should existing customers get help?",
    body: "Existing customers should be routed to support for account, implementation, PMS sync, billing, or runtime issues.",
    tags: ["support", "customer", "issue", "billing", "sync", "help"]
  }
];

export function buildLizKnowledgeBase(): LizKnowledgeRecord[] {
  return [
    ...PRODUCT_CATALOG.map(capability => ({
      id: `product-${capability.id}`,
      source: "product_catalog" as const,
      title: capability.name,
      body: `${capability.description} Required plan: ${capability.requiredPlan}. Category: ${capability.category}. Workflows: ${capability.workflowIds.join(", ") || "none"}.`,
      tags: [capability.category, capability.requiredPlan, capability.name, capability.id, ...capability.workflowIds]
    })),
    ...workflowCatalog.map(workflow => ({
      id: `workflow-${workflow.id}-${workflow.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      source: "workflow_catalog" as const,
      title: workflow.name,
      body: `${workflow.problem} Expected outcome: ${workflow.expectedOutcome}. Measurable outcomes: ${workflow.measurableOutcomes.join(", ")}.`,
      tags: [workflow.category, workflow.id, workflow.name, ...workflow.measurableOutcomes]
    })),
    ...automationRegistry.map(automation => ({
      id: `automation-${automation.id}`,
      source: "automation_catalog" as const,
      title: automation.name,
      body: `${automation.description} Triggers: ${automation.triggers.join(", ")}. Actions: ${automation.actions.join(", ")}. Intelligence outputs: ${automation.intelligenceOutputs.join(", ")}.`,
      tags: [automation.domain, automation.id, automation.name, ...automation.triggers, ...automation.actions]
    })),
    {
      id: "roi-framework",
      source: "roi_framework",
      title: "ROI and Practice Health Framework",
      body: "Zenith models no-show loss, recall gaps, administrative capacity drag, treatment opportunity, chair-fill opportunity, review opportunity, referral opportunity, and Practice Health Score. It estimates opportunity but does not guarantee financial outcomes.",
      tags: ["roi", "assessment", "practice health", "no-show", "recall", "treatment", "review", "referral"]
    },
    ...lizFaqLibrary
  ];
}

export function retrieveLizKnowledge(query: string, limit = 5) {
  const normalized = normalize(query);
  const terms = normalized.split(" ").filter(term => term.length > 2);
  return buildLizKnowledgeBase()
    .map(record => {
      const haystack = normalize(`${record.title} ${record.body} ${record.tags.join(" ")}`);
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      return { record, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.record);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}
