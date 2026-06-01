import "server-only";

/**
 * Extension Runtime — provides extensions with a sandboxed interface to the
 * Zenith platform.  Extensions route through this layer; they NEVER access
 * Runtime Kernel or Workflow OS directly.
 */

import { getInstalledExtensions } from "@/lib/marketplace-core/extension-loader";
import { publishEvent } from "@/lib/event-fabric";
import { routeWorkflow } from "@/lib/workflow-os/workflow-router";
import type { WorkflowTrigger } from "@/lib/workflow-os/workflow-router";

export interface ExtensionWorkflowRequest {
  extensionId: string;
  organizationId: string;
  trigger: WorkflowTrigger;
  payload?: Record<string, unknown>;
}

/**
 * An extension triggers a workflow — always routes through Workflow OS.
 * Extensions cannot bypass the execution engine.
 */
export async function extensionTriggerWorkflow(req: ExtensionWorkflowRequest) {
  // Verify the extension is installed
  const installed = await getInstalledExtensions(req.organizationId);
  const ext = installed.find(e => e.extensionId === req.extensionId && e.status === "active");
  if (!ext) {
    throw new Error(`Extension "${req.extensionId}" is not active for organization ${req.organizationId}.`);
  }
  if (ext.organizationId !== req.organizationId) {
    throw new Error("Cross-tenant extension access denied");
  }

  // Publish marketplace event for observability
  await publishEvent({
    event_type: "extension.workflow.triggered",
    event_source: "workflow_os",
    correlation_id: `ext:${req.extensionId}:${Date.now()}`,
    tenant_id: req.organizationId,
    workflow_id: req.trigger,
    priority: "moderate",
    payload: {
      extensionId: req.extensionId,
      trigger: req.trigger,
      ...(req.payload ?? {}),
    },
  });

  // Delegate to Workflow OS
  return routeWorkflow({
    trigger: req.trigger,
    organizationId: req.organizationId,
    initiatedBy: "system",
    payload: { ...req.payload, extensionId: req.extensionId },
  });
}
