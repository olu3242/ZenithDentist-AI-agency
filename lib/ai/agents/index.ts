export interface AIAgentManifest {
  key: string;
  name: string;
  version: string;
  capabilities: string[];
  requiredPermissions: string[];
}

export const coreAIAgents: AIAgentManifest[] = [
  { key: "runtime_analyst", name: "Runtime Analyst", version: "1.0.0", capabilities: ["diagnostics", "incident_summary"], requiredPermissions: ["runtime:read"] },
  { key: "customer_success", name: "Customer Success Strategist", version: "1.0.0", capabilities: ["health_scoring", "churn_risk"], requiredPermissions: ["customer:read"] },
  { key: "recovery_planner", name: "Recovery Planner", version: "1.0.0", capabilities: ["replay_planning", "mitigation"], requiredPermissions: ["recovery:write"] }
];

export function discoverAgentCapabilities(key: string) {
  return coreAIAgents.find(agent => agent.key === key)?.capabilities ?? [];
}
