import "server-only";

import { getAutomationOSState } from "@/lib/automation-os/registry";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getAutonomousEngineState } from "@/lib/autonomous";
import { getActiveWorkflows } from "@/lib/workflow-os/workflow-registry";
import { getAvailableExtensions } from "@/lib/marketplace-core/extension-registry";

export type PlatformProductKey = "zenith" | "owambe_os" | "eduradius" | "finclarity" | "oasis_go" | "future_product";
export type PlatformOsKey =
  | "workflow_os"
  | "runtime_os"
  | "self_healing_os"
  | "recovery_os"
  | "knowledge_os"
  | "simulation_os"
  | "governance_os"
  | "marketplace_os"
  | "observability_os"
  | "decision_os"
  | "execution_os"
  | "learning_os";
export type AliceResponsibility = "detect" | "diagnose" | "recommend" | "recover" | "verify" | "learn";
export type AutonomyLevel = 0 | 1 | 2 | 3 | 4;
export type AgentType = "revenue" | "growth" | "operations" | "compliance" | "recovery" | "forecasting" | "support";

export interface PlatformOsDefinition {
  key: PlatformOsKey;
  name: string;
  purpose: string;
  capabilities: string[];
  productAgnosticContracts: string[];
  tenantControls: string[];
  personaAwareness: string[];
  eventInputs: string[];
  eventOutputs: string[];
  aliceResponsibilities: AliceResponsibility[];
  primaryModules: string[];
}

export interface PlatformAgentDefinition {
  type: AgentType;
  name: string;
  sharedResources: string[];
  decisions: string[];
  requiredPolicies: string[];
}

export interface PlatformAutonomyMode {
  level: AutonomyLevel;
  name: string;
  description: string;
  allowedExecution: string;
}

export interface PlatformFoundationState {
  products: PlatformProductKey[];
  osLayers: PlatformOsDefinition[];
  agents: PlatformAgentDefinition[];
  autonomyModes: PlatformAutonomyMode[];
  reusableRequirements: string[];
  aliceLoop: AliceResponsibility[];
  implementation: {
    activeWorkflowCount: number;
    marketplaceExtensionCount: number;
    runtimeOperationalScore: number;
    automationExecutions: number;
    autonomousConfidence: number;
  };
}

export const reusableProducts: PlatformProductKey[] = ["zenith", "owambe_os", "eduradius", "finclarity", "oasis_go", "future_product"];

export const platformOsLayers: PlatformOsDefinition[] = [
  osLayer("observability_os", "Observability OS", "Observe every tenant, workflow, integration, user action, automation, and AI decision.", ["Unified event graph", "Correlation propagation", "Trace capture", "SLA monitoring", "Event normalization"], ["Canonical event envelope", "Correlation id", "Tenant id", "Actor id", "Source system"], ["Tenant-scoped event reads", "Tenant event retention", "PII redaction by tenant policy"], ["Role-filtered event views", "Persona-specific alerts"], ["revenue events", "patient events", "workflow events", "integration events", "user actions", "automation events", "AI decisions"], ["normalized runtime events", "trace signals", "risk signals"], ["detect", "verify", "learn"], ["lib/runtime/observability.ts", "lib/runtime/event-fabric.ts", "lib/runtime/trace-engine.ts"]),
  osLayer("decision_os", "Decision OS", "Decide what should happen using rules, policy, risk, opportunity, and recommendation engines.", ["Rules engine", "Policy engine", "Risk engine", "Recommendation engine", "Opportunity engine"], ["Decision request", "Policy context", "Risk score", "Recommendation payload"], ["Tenant policy overrides", "Tenant approval thresholds"], ["Persona-specific recommendations", "Persona-specific risk tolerance"], ["workflow state", "runtime health", "knowledge graph", "simulation output"], ["recommended actions", "approval requests", "blocked decisions"], ["diagnose", "recommend", "learn"], ["lib/ai-os/agent-governance.ts", "lib/action-engine.ts", "lib/alice/operational-intelligence.ts"]),
  osLayer("execution_os", "Execution OS", "Execute decisions through workflow launch, agent orchestration, automation, and task routing.", ["Launch", "Pause", "Retry", "Rollback", "Escalate"], ["Workflow execution request", "Idempotency key", "Execution result"], ["Tenant workflow registry", "Tenant SLA override", "Tenant execution limits"], ["Persona launch permissions", "Persona approval paths"], ["approved recommendations", "scheduled triggers", "manual actions"], ["workflow started", "workflow paused", "workflow failed", "workflow completed"], ["recover", "verify", "learn"], ["lib/workflow-os/workflow-engine.ts", "components/workflow/workflow-launcher.tsx", "lib/automation-os/registry.ts"]),
  osLayer("workflow_os", "Workflow OS", "Provide product-agnostic workflow registration, routing, state, scheduling, analytics, and execution.", ["Registry", "Router", "State machine", "Scheduler", "Versioning", "Analytics"], ["Workflow definition", "Trigger", "Lifecycle state", "Outcome metric"], ["Tenant overrides", "Tenant-scoped registry", "Tenant analytics"], ["Persona-specific workflow catalog", "Role-aware launch controls"], ["trigger events", "manual launch events", "agent decisions"], ["workflow lifecycle events", "analytics events"], ["recover", "verify", "learn"], ["lib/workflow-os/*"]),
  osLayer("runtime_os", "Runtime OS", "Operate traces, dead letters, runtime health, provider health, replay, and incident posture.", ["Tracing", "Dead letters", "Provider health", "Replay", "Incident management"], ["Trace record", "Dead-letter record", "Replay candidate"], ["Tenant runtime isolation", "Tenant trace retention", "Tenant replay policy"], ["Persona incident views", "Persona recovery queues"], ["workflow events", "provider events", "failure events"], ["health scores", "replay candidates", "incident signals"], ["detect", "diagnose", "verify"], ["lib/runtime/kernel/index.ts"]),
  osLayer("self_healing_os", "Self-Healing OS", "Plan automatic mitigation before failures become operator work.", ["Retry planning", "Remediation suggestions", "Safe degraded mode", "Provider switching"], ["Failure classification", "Remediation plan", "Safety constraint"], ["Tenant recovery policy", "Provider preference by tenant"], ["Persona escalation routing", "Role-specific mitigation approvals"], ["runtime failures", "provider degradation", "SLA breaches"], ["retry plans", "remediation plans", "degraded mode notices"], ["diagnose", "recover", "verify"], ["lib/runtime/self-healing.ts"]),
  osLayer("recovery_os", "Recovery OS", "Recover automatically with retry, failover, replay, compensation, and rollback.", ["Retry", "Failover", "Replay", "Compensate", "Rollback"], ["Recovery action plan", "Replay request", "Rollback guard"], ["Tenant recovery boundaries", "Tenant compensation rules"], ["Approval by persona", "Executive risk visibility"], ["dead letters", "failed traces", "provider outages"], ["recovery plans", "replay results", "stabilization scores"], ["recover", "verify", "learn"], ["lib/runtime/autonomous-recovery.ts", "lib/runtime/recovery-orchestrator.ts", "lib/runtime/replay-engine.ts"]),
  osLayer("knowledge_os", "Knowledge OS", "Ground decisions in product, tenant, workflow, policy, and operational knowledge.", ["Knowledge graph", "Source grounding", "Memory", "Policy context", "Learning signals"], ["Knowledge node", "Knowledge edge", "Grounding citation"], ["Tenant knowledge scopes", "Tenant redaction controls"], ["Persona-specific knowledge retrieval", "Role-specific explanation depth"], ["documents", "workflow metadata", "tenant facts", "outcomes"], ["grounded context", "explanations", "confidence signals"], ["diagnose", "recommend", "learn"], ["lib/alice/knowledge/index.ts", "lib/ai-os/agent-memory.ts"]),
  osLayer("simulation_os", "Simulation OS", "Run digital twin scenarios before execution.", ["Scenario modeling", "Forecast deltas", "Workflow simulation", "Portfolio scenario comparison"], ["Simulation input", "Scenario result", "Confidence score"], ["Tenant digital twin", "Tenant benchmarks"], ["Persona-specific scenario templates", "Executive vs operator views"], ["workflow proposals", "benchmark data", "forecast history"], ["simulated impact", "risk estimate", "confidence"], ["diagnose", "recommend", "verify", "learn"], ["lib/runtime/simulation-engine.ts", "lib/runtime/digital-twin.ts", "lib/autonomous.ts"]),
  osLayer("governance_os", "Governance OS", "Control AI, workflow, tenant, marketplace, and replay decisions with audit-safe policy.", ["Policy evaluation", "Approval routing", "Audit timeline", "Trust scoring", "Rollback governance"], ["Governance decision", "Approval record", "Audit event"], ["Tenant policies", "Tenant role matrix", "Tenant RLS verification"], ["Persona approval chains", "Persona-specific trust views"], ["agent decisions", "workflow changes", "extension installs", "replays"], ["approvals", "blocks", "audit records"], ["recommend", "verify", "learn"], ["lib/runtime/governance.ts", "lib/workflow-os/workflow-governance.ts", "lib/tenant/tenant-governance.ts"]),
  osLayer("marketplace_os", "Marketplace OS", "Install, govern, secure, and run reusable extensions and workflow packs across products.", ["Extension registry", "Install governance", "Config validation", "Runtime trigger", "Pack distribution"], ["Extension manifest", "Install decision", "Runtime trigger request"], ["Tenant installs", "Tenant config redaction", "Tenant entitlement"], ["Persona install permissions", "Persona marketplace views"], ["install requests", "extension triggers", "config changes"], ["install decisions", "workflow triggers", "security findings"], ["diagnose", "recommend", "verify"], ["lib/marketplace-core/*", "app/automation-marketplace/*"]),
  osLayer("learning_os", "Learning OS", "Continuously improve recommendations from outcomes, operator decisions, ROI, response rates, and workflow performance.", ["Outcome capture", "Decision memory", "Acceptance rate", "ROI feedback", "Performance learning"], ["Learning signal", "Outcome metric", "Feedback record"], ["Tenant learning isolation", "Cross-tenant benchmark anonymization"], ["Persona feedback capture", "Role-specific recommendation tuning"], ["workflow outcomes", "operator decisions", "campaign response", "runtime performance"], ["updated confidence", "recommendation tuning", "benchmark deltas"], ["learn"], ["lib/ai-os/agent-learning.ts", "lib/action-engine.ts"])
];

export const platformAgents: PlatformAgentDefinition[] = [
  agent("revenue", "Revenue Agent", ["memory", "policies", "knowledge", "telemetry"], ["prioritize revenue recovery", "recommend recovery workflow"], ["tenant revenue policy", "approval threshold"]),
  agent("growth", "Growth Agent", ["memory", "policies", "knowledge", "telemetry"], ["recommend review, referral, and lead campaigns"], ["brand policy", "campaign approval policy"]),
  agent("operations", "Operations Agent", ["memory", "policies", "knowledge", "telemetry"], ["optimize schedules and capacity"], ["staffing policy", "SLA policy"]),
  agent("compliance", "Compliance Agent", ["memory", "policies", "knowledge", "telemetry"], ["block unsafe actions", "route approvals"], ["governance policy", "privacy policy"]),
  agent("recovery", "Recovery Agent", ["memory", "policies", "knowledge", "telemetry"], ["retry, replay, rollback, failover"], ["recovery policy", "rollback policy"]),
  agent("forecasting", "Forecasting Agent", ["memory", "policies", "knowledge", "telemetry"], ["simulate outcomes", "forecast risk"], ["simulation confidence policy"]),
  agent("support", "Support Agent", ["memory", "policies", "knowledge", "telemetry"], ["summarize incidents", "recommend operator next steps"], ["support escalation policy"])
];

export const autonomyModes: PlatformAutonomyMode[] = [
  { level: 0, name: "Observe Only", description: "Collect signals and show state without recommendations.", allowedExecution: "No autonomous execution." },
  { level: 1, name: "Recommend", description: "ALICE recommends actions with evidence.", allowedExecution: "No execution without operator launch." },
  { level: 2, name: "Recommend + Human Approval", description: "ALICE prepares actions for approval.", allowedExecution: "Execute after explicit approval." },
  { level: 3, name: "Execute Approved Playbooks", description: "Pre-approved playbooks run automatically inside governance limits.", allowedExecution: "Execute approved playbooks, escalate exceptions." },
  { level: 4, name: "Fully Autonomous", description: "Routine operational events are handled end-to-end with verification and learning.", allowedExecution: "Execute, recover, verify, and learn inside policy boundaries." }
];

export const reusablePlatformRequirements = ["Product agnostic", "Multi-tenant", "Persona aware", "Event driven", "API first", "AI native", "Self-healing", "Extensible"];
export const aliceLoop: AliceResponsibility[] = ["detect", "diagnose", "recommend", "recover", "verify", "learn"];

export async function getPlatformFoundationState(): Promise<PlatformFoundationState> {
  const [runtime, automation, autonomous] = await Promise.all([
    getRuntimeHealthState(),
    getAutomationOSState(),
    getAutonomousEngineState()
  ]);

  return {
    products: reusableProducts,
    osLayers: platformOsLayers,
    agents: platformAgents,
    autonomyModes,
    reusableRequirements: reusablePlatformRequirements,
    aliceLoop,
    implementation: {
      activeWorkflowCount: getActiveWorkflows().length,
      marketplaceExtensionCount: getAvailableExtensions().length,
      runtimeOperationalScore: runtime.scores.operationalScore,
      automationExecutions: automation.counts.totalExecutions,
      autonomousConfidence: autonomous.confidence
    }
  };
}

function osLayer(
  key: PlatformOsKey,
  name: string,
  purpose: string,
  capabilities: string[],
  productAgnosticContracts: string[],
  tenantControls: string[],
  personaAwareness: string[],
  eventInputs: string[],
  eventOutputs: string[],
  aliceResponsibilities: AliceResponsibility[],
  primaryModules: string[]
): PlatformOsDefinition {
  return { key, name, purpose, capabilities, productAgnosticContracts, tenantControls, personaAwareness, eventInputs, eventOutputs, aliceResponsibilities, primaryModules };
}

function agent(
  type: AgentType,
  name: string,
  sharedResources: string[],
  decisions: string[],
  requiredPolicies: string[]
): PlatformAgentDefinition {
  return { type, name, sharedResources, decisions, requiredPolicies };
}
