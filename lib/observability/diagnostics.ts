import "server-only";

import { getRuntimeDiagnostics } from "@/lib/runtime-config";
import { getAutomationQueueMetrics } from "@/lib/automation/runtime";
import { checkAIProviderHealth } from "@/lib/ai/runtime";

export async function getReadinessCheck() {
  const diagnostics = getRuntimeDiagnostics();
  const queue = await getAutomationQueueMetrics();
  const ai = await checkAIProviderHealth();
  const errors = Object.values(diagnostics.groups).filter(item => item.status === "error");
  return {
    ready: errors.length === 0,
    diagnostics,
    queue,
    ai,
    checkedAt: new Date().toISOString()
  };
}

export function getLivenessCheck() {
  return {
    alive: true,
    uptimeSeconds: Math.round(process.uptime()),
    checkedAt: new Date().toISOString()
  };
}
