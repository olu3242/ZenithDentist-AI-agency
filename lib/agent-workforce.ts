import "server-only";

import { autonomyModes, type AutonomyLevel } from "@/lib/platform-os";

export type WorkforceAgentKey =
  | "revenue_agent"
  | "growth_agent"
  | "operations_agent"
  | "patient_success_agent"
  | "pms_agent"
  | "support_agent"
  | "compliance_agent"
  | "recovery_agent";

export type WorkforcePersona = "practice_owner" | "office_manager" | "marketing_coordinator" | "support_team" | "zenith_internal";

export interface WorkforceAgent {
  key: WorkforceAgentKey;
  name: string;
  purpose: string;
  responsibilities: string[];
  outputs: string[];
  operatingSystems: string[];
  defaultAutonomyLevel: AutonomyLevel;
}

export interface AliceChiefIntelligenceModel {
  title: string;
  responsibilities: string[];
  communicationRules: string[];
  conflictResolution: string[];
}

export const agentWorkforce: WorkforceAgent[] = [
  {
    key: "revenue_agent",
    name: "Revenue Agent",
    purpose: "Recover lost production.",
    responsibilities: ["Recall recovery", "No-show recovery", "Treatment recovery", "Revenue forecasting", "Revenue opportunity detection"],
    outputs: ["Revenue recovered", "Revenue at risk", "Recovery recommendations"],
    operatingSystems: ["Workflow OS", "Runtime OS", "Decision OS", "Revenue Command Center"],
    defaultAutonomyLevel: 2
  },
  {
    key: "growth_agent",
    name: "Growth Agent",
    purpose: "Grow the practice.",
    responsibilities: ["Review generation", "Referral growth", "Lead nurturing", "Campaign optimization", "Reputation monitoring"],
    outputs: ["New patients", "Reviews", "Referrals"],
    operatingSystems: ["Workflow OS", "Knowledge OS", "Simulation OS", "Growth Command Center"],
    defaultAutonomyLevel: 2
  },
  {
    key: "operations_agent",
    name: "Operations Agent",
    purpose: "Optimize daily operations.",
    responsibilities: ["Schedule optimization", "Capacity balancing", "Resource allocation", "Workflow monitoring"],
    outputs: ["Utilization", "Efficiency", "Operational score"],
    operatingSystems: ["Runtime OS", "Workflow OS", "Simulation OS", "Operations Command Center"],
    defaultAutonomyLevel: 2
  },
  {
    key: "patient_success_agent",
    name: "Patient Success Agent",
    purpose: "Improve retention.",
    responsibilities: ["Patient lifecycle management", "Recall tracking", "Reactivation", "Communication orchestration"],
    outputs: ["Retention", "Reactivation", "Patient engagement"],
    operatingSystems: ["Workflow OS", "Knowledge OS", "Patient Lifecycle Engine"],
    defaultAutonomyLevel: 2
  },
  {
    key: "pms_agent",
    name: "PMS Agent",
    purpose: "Manage integrations.",
    responsibilities: ["OpenDental sync", "Dentrix sync", "Eaglesoft sync", "Data validation", "Sync recovery"],
    outputs: ["Sync health", "Data quality", "Integration health"],
    operatingSystems: ["Runtime OS", "Recovery OS", "Self-Healing OS", "Governance OS"],
    defaultAutonomyLevel: 1
  },
  {
    key: "support_agent",
    name: "Support Agent",
    purpose: "Customer success.",
    responsibilities: ["Support triage", "Knowledge retrieval", "Ticket creation", "Escalation"],
    outputs: ["Resolution time", "Customer satisfaction"],
    operatingSystems: ["Knowledge OS", "Governance OS", "Event Fabric"],
    defaultAutonomyLevel: 1
  },
  {
    key: "compliance_agent",
    name: "Compliance Agent",
    purpose: "Governance.",
    responsibilities: ["Audit trails", "Permissions", "Policy validation", "Security monitoring"],
    outputs: ["Compliance score", "Risk score"],
    operatingSystems: ["Governance OS", "Runtime OS", "Knowledge OS"],
    defaultAutonomyLevel: 1
  },
  {
    key: "recovery_agent",
    name: "Recovery Agent",
    purpose: "Self-healing.",
    responsibilities: ["Detect failures", "Retry operations", "Failover services", "Verify recovery"],
    outputs: ["Recovery rate", "Incident resolution"],
    operatingSystems: ["Self-Healing OS", "Recovery OS", "Runtime OS", "Workflow OS"],
    defaultAutonomyLevel: 3
  }
];

export const personaAgentMap: Record<WorkforcePersona, WorkforceAgentKey[]> = {
  practice_owner: ["revenue_agent", "growth_agent"],
  office_manager: ["operations_agent", "patient_success_agent", "pms_agent"],
  marketing_coordinator: ["growth_agent"],
  support_team: ["support_agent", "recovery_agent"],
  zenith_internal: ["compliance_agent", "recovery_agent", "pms_agent", "support_agent"]
};

export const aliceChiefIntelligenceModel: AliceChiefIntelligenceModel = {
  title: "ALICE Chief Operating Intelligence",
  responsibilities: ["Coordinate agents", "Prioritize actions", "Resolve conflicts", "Simulate outcomes", "Learn from results"],
  communicationRules: ["Agents communicate through Event Fabric", "Workflow OS launches execution", "Runtime OS verifies execution", "Knowledge OS grounds recommendations", "No direct agent coupling"],
  conflictResolution: ["Compliance Agent can block unsafe actions", "Recovery Agent can override routine timing during incidents", "ALICE resolves revenue vs capacity conflicts through simulation", "Human approval is required above tenant autonomy threshold"]
};

export function getAgentsForPersona(persona: WorkforcePersona) {
  const keys = personaAgentMap[persona];
  return agentWorkforce.filter(agent => keys.includes(agent.key));
}

export function getAgentWorkforceState() {
  return {
    agents: agentWorkforce,
    personaAgentMap,
    alice: aliceChiefIntelligenceModel,
    autonomyModes,
    communicationBackbone: ["Event Fabric", "Workflow OS", "Runtime OS", "Knowledge OS"]
  };
}
