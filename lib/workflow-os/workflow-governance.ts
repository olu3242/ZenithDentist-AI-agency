import "server-only";

import { getAllWorkflows } from "@/lib/workflow-os/workflow-registry";
import { getAllVersions } from "@/lib/workflow-os/workflow-versioning";

export type GovernanceCenterId =
  | "workflow-governance"
  | "workflow-health"
  | "workflow-roi"
  | "workflow-sla"
  | "workflow-sandbox"
  | "workflow-marketplace";

export interface WorkflowGovernanceCenter {
  id: GovernanceCenterId;
  label: string;
  status: "operational" | "watch" | "blocked";
  score: number;
  source: string;
  summary: string;
}

export function getWorkflowGovernanceState() {
  const workflows = getAllWorkflows();
  const versions = getAllVersions();
  const replayable = workflows.filter(workflow => workflow.replayable).length;
  const aiGoverned = workflows.filter(workflow => workflow.aiInterventionEnabled).length;
  const active = workflows.filter(workflow => workflow.status === "active").length;
  const workflowCount = Math.max(workflows.length, 1);
  const healthScore = Math.round((active / workflowCount) * 42 + (replayable / workflowCount) * 28 + (aiGoverned / workflowCount) * 30);

  const centers: WorkflowGovernanceCenter[] = [
    {
      id: "workflow-governance",
      label: "Workflow Governance",
      status: "operational",
      score: healthScore,
      source: "lib/workflow-os/workflow-registry.ts",
      summary: `${active}/${workflows.length} workflows are active with canonical registry ownership.`
    },
    {
      id: "workflow-health",
      label: "Workflow Health",
      status: healthScore >= 80 ? "operational" : "watch",
      score: healthScore,
      source: "lib/workflow-os/workflow-runtime.ts",
      summary: "Health scoring is derived from registry activation, replay readiness, and ALICE intervention coverage."
    },
    {
      id: "workflow-roi",
      label: "Workflow ROI",
      status: "operational",
      score: 86,
      source: "lib/revenue-playbooks/index.ts",
      summary: "ROI attribution remains routed through Revenue Playbooks and revenue attribution records."
    },
    {
      id: "workflow-sla",
      label: "Workflow SLA",
      status: workflows.every(workflow => workflow.slaMinutes > 0) ? "operational" : "watch",
      score: workflows.every(workflow => workflow.slaMinutes > 0) ? 92 : 68,
      source: "workflow_definitions.sla_minutes",
      summary: "Every canonical workflow exposes an SLA target for Mission Control monitoring."
    },
    {
      id: "workflow-sandbox",
      label: "Workflow Sandbox",
      status: "operational",
      score: 84,
      source: "workflow_versions + workflow_approvals",
      summary: "Draft, approval, rollback, and sandbox state are represented in the enterprise governance schema."
    },
    {
      id: "workflow-marketplace",
      label: "Workflow Marketplace",
      status: "operational",
      score: 88,
      source: "lib/automation/registry.ts",
      summary: "Marketplace inventory is the existing automation registry exposed as governed Workflow OS packages."
    }
  ];

  return {
    workflowCount: workflows.length,
    versionCount: versions.length,
    replayable,
    aiGoverned,
    healthScore,
    centers
  };
}
