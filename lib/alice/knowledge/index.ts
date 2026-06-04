import "server-only";

export type AliceKnowledgeDomain =
  | "platform"
  | "mission_control"
  | "revenue"
  | "workflow_governance"
  | "pms_operations"
  | "analytics"
  | "commercial_operations"
  | "pilot_operations"
  | "installation"
  | "configuration"
  | "playbooks"
  | "implementation_intelligence"
  | "enterprise_moat"
  | "rbac"
  | "tenant_isolation";

export interface AliceKnowledgeRecord {
  domain: AliceKnowledgeDomain;
  version: string;
  owner: string;
  sources: string[];
  capabilities: string[];
  certification: "certified" | "partial" | "requires_remediation";
  summary: string;
}

export const aliceKnowledgeMap: AliceKnowledgeRecord[] = [
  {
    domain: "platform",
    version: "3.0.0",
    owner: "ALICE Operational Intelligence Layer",
    sources: ["lib/analytics-projector.ts", "lib/patient-revenue-engine.ts", "app/mission-control/page.tsx"],
    capabilities: ["platform awareness", "change awareness", "operational scoring"],
    certification: "certified",
    summary: "ALICE understands Zenith PROS as one Patient Revenue Operating System composed of Mission Control, Workflow OS, PMS Operations, Revenue Playbooks, and analytics projection."
  },
  {
    domain: "mission_control",
    version: "3.0.0",
    owner: "Mission Control",
    sources: ["app/mission-control/page.tsx", "components/mission-control/*"],
    capabilities: ["executive scorecard", "risk routing", "workflow advisory"],
    certification: "certified",
    summary: "Mission Control remains the executive operating surface for runtime, workflow, PMS, revenue, and ALICE intelligence."
  },
  {
    domain: "revenue",
    version: "3.0.0",
    owner: "Revenue Attribution Engine",
    sources: ["lib/roi.ts", "lib/revenue-playbooks/index.ts", "lib/data/leads.ts"],
    capabilities: ["revenue forecasting", "opportunity scoring", "playbook recommendation"],
    certification: "certified",
    summary: "Revenue intelligence is grounded in ROI assessments, revenue playbooks, and attribution records."
  },
  {
    domain: "workflow_governance",
    version: "3.0.0",
    owner: "Workflow OS",
    sources: ["lib/workflow-os/*", "supabase/migrations/20260601170000_workflow_os_enterprise_governance.sql"],
    capabilities: ["version awareness", "approval awareness", "SLA awareness", "ROI awareness"],
    certification: "certified",
    summary: "Workflow governance extends the canonical Workflow OS with versioning, approval, sandbox, SLA, audit, dependency, marketplace, and ROI metadata."
  },
  {
    domain: "implementation_intelligence",
    version: "2.0.0",
    owner: "Client Success OS",
    sources: [
      "lib/implementation-intelligence.ts",
      "lib/client-implementation-os.ts",
      "supabase/migrations/20260701000000_implementation_intelligence_layer.sql",
      "supabase/migrations/20260702000000_enterprise_moat_autonomous_practice.sql",
      "lib/automation/registry.ts"
    ],
    capabilities: ["baseline scoring", "revenue leak detection", "PMS readiness", "activation guidance", "go-live certification", "enterprise moat visibility"],
    certification: "partial",
    summary: "ALICE grounds Implementation Advisor recommendations in baseline snapshots, implementation scores, revenue leaks, PMS readiness, workflow configurations, patient segments, go-live certification evidence, and Batches 25-32 enterprise moat centers."
  },
  {
    domain: "enterprise_moat",
    version: "1.0.0",
    owner: "ALICE Autonomous Practice Intelligence",
    sources: [
      "lib/implementation-intelligence.ts",
      "components/mission-control/implementation-command-center.tsx",
      "supabase/migrations/20260702000000_enterprise_moat_autonomous_practice.sql",
      "lib/automation/registry.ts"
    ],
    capabilities: ["PMS intelligence", "insurance recovery", "provider scoring", "hygiene growth", "AI workforce orchestration", "clinical education intelligence", "practice forecasting", "autonomous growth planning"],
    certification: "partial",
    summary: "ALICE extends existing Mission Control and Workflow OS intelligence with PMS, insurance, provider, hygiene, AI workforce, clinical education, forecasting, and autonomous growth plan grounding."
  },
  {
    domain: "pms_operations",
    version: "3.0.0",
    owner: "PMS Operations Center",
    sources: ["lib/pms-operations.ts", "app/dashboard/pms/*"],
    capabilities: ["PMS awareness", "sync health awareness", "mapping awareness"],
    certification: "certified",
    summary: "PMS context is surfaced from the canonical PMS Operations Center route family."
  },
  {
    domain: "rbac",
    version: "3.0.0",
    owner: "Platform Security",
    sources: ["middleware.ts", "lib/auth-routing.ts", "lib/security-edge.ts"],
    capabilities: ["persona awareness", "permission awareness", "route awareness"],
    certification: "partial",
    summary: "ALICE can reason about route and persona boundaries; live RLS proof remains an environment certification step."
  },
  {
    domain: "tenant_isolation",
    version: "3.0.0",
    owner: "Tenant Guard",
    sources: ["lib/tenant/index.ts", "docs/TENANT_ISOLATION_CERTIFICATION.md"],
    capabilities: ["tenant awareness", "cross-tenant leakage detection"],
    certification: "partial",
    summary: "Tenant isolation is represented in the platform model and requires linked Supabase validation before commercial launch."
  }
];

export function getAliceKnowledgeHealth() {
  const certified = aliceKnowledgeMap.filter(record => record.certification === "certified").length;
  const partial = aliceKnowledgeMap.filter(record => record.certification === "partial").length;
  const coverageScore = Math.round((certified / aliceKnowledgeMap.length) * 100);

  return {
    version: "ALICE V3",
    records: aliceKnowledgeMap,
    coverageScore,
    certified,
    partial,
    driftSignals: aliceKnowledgeMap
      .filter(record => record.certification !== "certified")
      .map(record => `${record.domain}: ${record.certification}`)
  };
}
