import "server-only";

import { automationRegistry } from "@/lib/automation/registry";
import { getRuntimeHealthState, type RuntimeHealthState } from "@/lib/runtime/automation-health";

export type OperationalSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface DependencyIssue {
  id: string;
  workflowId: string;
  category:
    | "missing_provider"
    | "failed_queue"
    | "stale_workflow"
    | "disconnected_handler"
    | "orphaned_event"
    | "missing_observability"
    | "invalid_environment";
  severity: OperationalSeverity;
  detail: string;
}

export async function detectDependencyIssues() {
  const runtime = await getRuntimeHealthState();
  return detectDependencyIssuesFromRuntime(runtime);
}

export function detectDependencyIssuesFromRuntime(runtime: RuntimeHealthState): DependencyIssue[] {
  const issues: DependencyIssue[] = [];
  const traceWorkflowIds = new Set(runtime.traces.map(trace => trace.workflow_id));

  for (const blueprint of automationRegistry) {
    if ((blueprint.dependencies ?? []).some(dependency => dependency.includes("sync")) && !traceWorkflowIds.has(blueprint.id)) {
      issues.push(issue(blueprint.id, "missing_provider", "HIGH", `${blueprint.name} depends on ${blueprint.dependencies?.join(", ")} but has no live runtime trace.`));
    }
    if (!blueprint.queueHandlers.length) {
      issues.push(issue(blueprint.id, "disconnected_handler", "CRITICAL", `${blueprint.name} has no queue handler declaration.`));
    }
    if (!blueprint.emittedEvents.length) {
      issues.push(issue(blueprint.id, "orphaned_event", "CRITICAL", `${blueprint.name} emits no operational event.`));
    }
    if (Object.values(blueprint.observability).some(value => !value)) {
      issues.push(issue(blueprint.id, "missing_observability", "HIGH", `${blueprint.name} lacks full tracing, metrics, logging, and alerting.`));
    }
    for (const requiredEnv of blueprint.requiredEnv ?? []) {
      if (!process.env[requiredEnv]) {
        issues.push(issue(blueprint.id, "invalid_environment", "CRITICAL", `${blueprint.name} requires ${requiredEnv}.`));
      }
    }
  }

  for (const failed of runtime.unhealthyWorkflows) {
    issues.push(issue(failed.workflowId, "failed_queue", failed.severity === "critical" ? "CRITICAL" : "HIGH", failed.reason));
  }

  for (const domain of runtime.domainHealth) {
    if (domain.workflowCount > 0 && domain.traceCount === 0) {
      issues.push(issue(`${domain.domain}_runtime`, "stale_workflow", "MODERATE", `${domain.domain.replace(/_/g, " ")} has no live traces in the current runtime window.`));
    }
  }

  return dedupeIssues(issues);
}

function issue(workflowId: string, category: DependencyIssue["category"], severity: OperationalSeverity, detail: string): DependencyIssue {
  return { id: `${workflowId}:${category}`, workflowId, category, severity, detail };
}

function dedupeIssues(issues: DependencyIssue[]) {
  const seen = new Set<string>();
  return issues.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
