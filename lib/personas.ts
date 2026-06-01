import type { ZenithRole } from "@/lib/auth-routing";

export type PersonaKey =
  | "front_desk_operator"
  | "clinical_provider"
  | "office_manager"
  | "practice_owner"
  | "dso_executive"
  | "agency_growth_operator"
  | "zenith_platform_operator";

export type MissionDomain = "revenue" | "patients" | "operations" | "automation" | "enterprise" | "platform";

export interface PersonaKpi {
  key: string;
  label: string;
  outcome: string;
  tone: "teal" | "rust" | "gold" | "green" | "blue";
}

export interface PersonaNavigationItem {
  href: string;
  label: string;
  description: string;
  domain: MissionDomain;
}

export interface PersonaDefinition {
  key: PersonaKey;
  label: string;
  roleLabel: string;
  defaultRoles: ZenithRole[];
  commandCenterPath: string;
  mission: string;
  operatingCadence: string;
  outcomes: string[];
  kpis: PersonaKpi[];
  aliceRecommendations: string[];
  workflows: string[];
  reports: string[];
  navigation: PersonaNavigationItem[];
}

export const personas: Record<PersonaKey, PersonaDefinition> = {
  front_desk_operator: {
    key: "front_desk_operator",
    label: "Patient Access Command Center",
    roleLabel: "Front Desk Operator",
    defaultRoles: ["staff"],
    commandCenterPath: "/dashboard/front-desk",
    mission: "Keep chairs filled, recover missed patients, and protect the daily schedule.",
    operatingCadence: "Hourly appointment, recall, no-show, and review queue review.",
    outcomes: ["Filled schedule", "Lower no-show rate", "Recovered recall patients", "More review requests"],
    kpis: [
      { key: "appointments", label: "Appointments", outcome: "Daily schedule volume", tone: "teal" },
      { key: "patientRecovery", label: "Patient Recovery", outcome: "Recall and reactivation focus", tone: "green" },
      { key: "workflowHealth", label: "Workflow Health", outcome: "Front desk automation reliability", tone: "blue" },
      { key: "reviewVelocity", label: "Review Velocity", outcome: "Reputation growth activity", tone: "gold" }
    ],
    aliceRecommendations: [
      "Prioritize patients with high value treatment plans and stale recall history.",
      "Send same-day no-show recovery before the schedule gap becomes permanent.",
      "Escalate review requests when completed appointments exceed daily reputation targets."
    ],
    workflows: ["Recall Recovery", "No-Show Prevention", "Review Request Follow-up", "Missed Call Recovery"],
    reports: ["Daily Schedule Recovery", "Recall Queue", "Review Request Activity"],
    navigation: [
      { href: "/dashboard", label: "Patient Access", description: "Persona command center", domain: "patients" },
      { href: "/portal/recall", label: "Recall Recovery", description: "Recall gap drilldown", domain: "patients" },
      { href: "/portal/reviews", label: "Review Growth", description: "Review request and sentiment view", domain: "patients" },
      { href: "/automation-center", label: "Automation Queue", description: "Trigger and monitor patient workflows", domain: "automation" },
      { href: "/settings", label: "Settings", description: "Profile and notification settings", domain: "operations" }
    ]
  },
  clinical_provider: {
    key: "clinical_provider",
    label: "Clinical Growth Command Center",
    roleLabel: "Clinical Provider",
    defaultRoles: ["staff"],
    commandCenterPath: "/dashboard/provider",
    mission: "Protect production, treatment follow-up, and patient outcomes from falling through gaps.",
    operatingCadence: "Daily treatment acceptance, open plans, and post-treatment follow-up review.",
    outcomes: ["Higher treatment acceptance", "Recovered production", "Fewer stale treatment plans", "Better patient follow-up"],
    kpis: [
      { key: "revenueRecovery", label: "Recovered Revenue", outcome: "Treatment and production opportunity", tone: "green" },
      { key: "patientRecovery", label: "Treatment Follow-up", outcome: "Open patient opportunities", tone: "teal" },
      { key: "appointments", label: "Booked Visits", outcome: "Clinical capacity utilization", tone: "blue" },
      { key: "workflowHealth", label: "Automation Reliability", outcome: "Clinical follow-up execution", tone: "gold" }
    ],
    aliceRecommendations: [
      "Review high-value unscheduled treatment plans before sending generic recall outreach.",
      "Ask staff to call patients with both treatment opportunity and high no-show risk.",
      "Package post-treatment review requests with completed high-satisfaction visits."
    ],
    workflows: ["Treatment Plan Follow-up", "Post Treatment Check-In", "Patient Reactivation", "Review Generation"],
    reports: ["Treatment Opportunity", "Provider Production Recovery", "Patient Follow-up"],
    navigation: [
      { href: "/dashboard", label: "Clinical Growth", description: "Persona command center", domain: "revenue" },
      { href: "/portal/revenue", label: "Production", description: "Recovered production drilldown", domain: "revenue" },
      { href: "/portal/patients", label: "Patients", description: "Patient health and follow-up", domain: "patients" },
      { href: "/automation-center", label: "Clinical Workflows", description: "Run clinical automations", domain: "automation" },
      { href: "/settings", label: "Settings", description: "Profile and notification settings", domain: "operations" }
    ]
  },
  office_manager: {
    key: "office_manager",
    label: "Practice Operations Command Center",
    roleLabel: "Office Manager",
    defaultRoles: ["staff"],
    commandCenterPath: "/dashboard/office-manager",
    mission: "Coordinate schedule, PMS readiness, staff execution, and automation follow-through.",
    operatingCadence: "Morning operating review plus end-of-day workflow exception clearance.",
    outcomes: ["Cleaner PMS sync", "Fewer operational exceptions", "Higher staff throughput", "Predictable follow-up"],
    kpis: [
      { key: "workflowHealth", label: "Workflow Health", outcome: "Operational automation posture", tone: "blue" },
      { key: "appointments", label: "Appointments", outcome: "Schedule execution", tone: "teal" },
      { key: "locations", label: "Locations", outcome: "Location coverage", tone: "gold" },
      { key: "slaBreaches", label: "Exceptions", outcome: "Runtime items needing attention", tone: "rust" }
    ],
    aliceRecommendations: [
      "Clear PMS sync exceptions before running recall campaigns.",
      "Move staff attention to the location with the highest schedule gap and lowest automation throughput.",
      "Resolve workflow failures before they affect patient-facing outreach."
    ],
    workflows: ["PMS Sync Health", "Staff Notifications", "Recall Recovery", "Insurance Follow-up"],
    reports: ["Operations Health", "PMS Sync Exceptions", "Staff Execution Summary"],
    navigation: [
      { href: "/dashboard", label: "Practice Ops", description: "Persona command center", domain: "operations" },
      { href: "/dashboard/pms", label: "PMS Operations", description: "PMS connection and sync health", domain: "operations" },
      { href: "/portal/locations", label: "Locations", description: "Location performance", domain: "enterprise" },
      { href: "/automation-center", label: "Workflow Queue", description: "Operational automation controls", domain: "automation" },
      { href: "/settings", label: "Settings", description: "Organization and profile settings", domain: "operations" }
    ]
  },
  practice_owner: {
    key: "practice_owner",
    label: "Executive Command Center",
    roleLabel: "Practice Owner",
    defaultRoles: ["practice_owner"],
    commandCenterPath: "/dashboard",
    mission: "See where the practice is leaking revenue, retention, and execution capacity.",
    operatingCadence: "Weekly executive review with daily ALICE alerts for revenue and patient risk.",
    outcomes: ["Revenue recovery", "Patient retention", "Automation ROI", "Leadership clarity"],
    kpis: [
      { key: "revenueRecovery", label: "Revenue Recovery", outcome: "Modeled monthly opportunity", tone: "green" },
      { key: "patientRecovery", label: "Patient Recovery", outcome: "Recall and retention opportunity", tone: "teal" },
      { key: "workflowHealth", label: "Automation ROI", outcome: "Automations running reliably", tone: "blue" },
      { key: "locations", label: "Locations", outcome: "Practice footprint", tone: "gold" }
    ],
    aliceRecommendations: [
      "Approve the highest ROI recovery workflow before expanding lower-value automations.",
      "Compare recall loss against benchmark snapshots before setting next month targets.",
      "Review strategy-session recommendations after every generated assessment report."
    ],
    workflows: ["Recall Recovery", "No-Show Prevention", "Review Generation", "Treatment Follow-up"],
    reports: ["Executive ROI Report", "Practice Health Report", "Revenue Forecast", "Automation ROI Summary"],
    navigation: [
      { href: "/dashboard", label: "Executive Command", description: "Owner operating system", domain: "revenue" },
      { href: "/portal/revenue", label: "Revenue", description: "Revenue, forecasting, reports, and simulations", domain: "revenue" },
      { href: "/portal/patients", label: "Patients", description: "Patients, recall, reviews, and retention", domain: "patients" },
      { href: "/portal/command", label: "Operations", description: "PMS, cloud, locations, and operations", domain: "operations" },
      { href: "/automation-center", label: "Automations", description: "Workflow OS and automation execution", domain: "automation" },
      { href: "/portal/reports", label: "Reports", description: "Executive reporting center", domain: "revenue" },
      { href: "/settings", label: "Settings", description: "Organization settings", domain: "operations" }
    ]
  },
  dso_executive: {
    key: "dso_executive",
    label: "DSO Enterprise Mission Control",
    roleLabel: "DSO Executive",
    defaultRoles: ["practice_owner", "super_admin"],
    commandCenterPath: "/portal/locations",
    mission: "Compare locations, standardize growth playbooks, and find enterprise-level variance.",
    operatingCadence: "Weekly portfolio review across revenue, patient retention, operations, and automation adoption.",
    outcomes: ["Location benchmarking", "Enterprise variance reduction", "Portfolio revenue recovery", "Governance visibility"],
    kpis: [
      { key: "locations", label: "Locations", outcome: "Enterprise coverage", tone: "gold" },
      { key: "revenueRecovery", label: "Portfolio Recovery", outcome: "Modeled recoverable revenue", tone: "green" },
      { key: "workflowHealth", label: "Automation Adoption", outcome: "Workflow health across locations", tone: "blue" },
      { key: "patientRecovery", label: "Retention Risk", outcome: "Patient recovery pressure", tone: "teal" }
    ],
    aliceRecommendations: [
      "Rank locations by revenue leakage before assigning implementation specialists.",
      "Use benchmark snapshots to identify outlier no-show and recall performance.",
      "Standardize automations only after confirming PMS data quality by location."
    ],
    workflows: ["Portfolio Benchmarking", "Location Rollout", "Governance Review", "Enterprise Reporting"],
    reports: ["Enterprise Mission Control", "Location Benchmark Report", "Portfolio ROI Report"],
    navigation: [
      { href: "/dashboard", label: "Enterprise Mission", description: "DSO command center", domain: "enterprise" },
      { href: "/portal/locations", label: "Locations", description: "Location benchmarking", domain: "enterprise" },
      { href: "/portal/forecasting", label: "Forecasting", description: "Portfolio forecasting", domain: "revenue" },
      { href: "/portal/reports", label: "Reports", description: "Enterprise reporting", domain: "revenue" },
      { href: "/automation-center", label: "Automations", description: "Enterprise automation rollout", domain: "automation" },
      { href: "/settings", label: "Settings", description: "Enterprise settings", domain: "operations" }
    ]
  },
  agency_growth_operator: {
    key: "agency_growth_operator",
    label: "Growth Operations Command Center",
    roleLabel: "Agency Growth Operator",
    defaultRoles: ["agency_admin"],
    commandCenterPath: "/dashboard",
    mission: "Convert assessments into qualified strategy sessions and implementation-ready clients.",
    operatingCadence: "Daily funnel, assessment, booking, and client delivery review.",
    outcomes: ["Assessment completion", "Qualified strategy sessions", "Implementation readiness", "Client expansion"],
    kpis: [
      { key: "leads", label: "Assessments", outcome: "Free assessment submissions", tone: "teal" },
      { key: "bookedCalls", label: "Strategy Sessions", outcome: "Post-assessment booking activity", tone: "green" },
      { key: "revenueRecovery", label: "Pipeline Value", outcome: "Modeled recovery opportunity", tone: "gold" },
      { key: "workflowHealth", label: "Delivery Health", outcome: "Automation execution posture", tone: "blue" }
    ],
    aliceRecommendations: [
      "Follow up with completed assessments before sending any consultation-first CTA.",
      "Route high-score practices to implementation readiness, not generic discovery.",
      "Use ALICE reports to personalize the first strategy-session agenda."
    ],
    workflows: ["Lead Follow-up", "Assessment Report Generation", "Strategy Session Booking", "Client Onboarding"],
    reports: ["Funnel Analytics", "Assessment Pipeline", "Client Delivery Readiness"],
    navigation: [
      { href: "/dashboard", label: "Growth Command", description: "Agency operating system", domain: "revenue" },
      { href: "/admin", label: "Funnel", description: "Leads, audits, bookings, and ROI", domain: "revenue" },
      { href: "/lead-operations", label: "Lead Ops", description: "Assessment and follow-up operations", domain: "operations" },
      { href: "/client-operations", label: "Client Ops", description: "Implementation and client delivery", domain: "operations" },
      { href: "/gtm-command-center", label: "GTM Command", description: "Growth command center", domain: "revenue" },
      { href: "/automation-center", label: "Automations", description: "Delivery automation controls", domain: "automation" },
      { href: "/settings", label: "Settings", description: "Agency settings", domain: "operations" }
    ]
  },
  zenith_platform_operator: {
    key: "zenith_platform_operator",
    label: "Zenith Internal Mission Control",
    roleLabel: "Zenith Platform Operator",
    defaultRoles: ["super_admin"],
    commandCenterPath: "/dashboard",
    mission: "Keep the multi-tenant platform observable, reliable, governed, and implementation-ready.",
    operatingCadence: "Continuous runtime watch with daily tenant, automation, and governance review.",
    outcomes: ["Platform reliability", "Tenant isolation", "Runtime recovery", "ALICE governance"],
    kpis: [
      { key: "workflowHealth", label: "Platform Health", outcome: "Runtime operational score", tone: "blue" },
      { key: "slaBreaches", label: "SLA Breaches", outcome: "Incidents requiring action", tone: "rust" },
      { key: "organizations", label: "Organizations", outcome: "Tenant inventory", tone: "teal" },
      { key: "automationExecutions", label: "Executions", outcome: "Automation throughput", tone: "green" }
    ],
    aliceRecommendations: [
      "Resolve unresolved dead letters before expanding workflow coverage.",
      "Review tenant scoping on any dashboard that mixes platform and client data.",
      "Prioritize ALICE recommendations with source traces and confidence evidence."
    ],
    workflows: ["Runtime Recovery", "Tenant Audit", "ALICE Grounding Review", "Workflow Replay"],
    reports: ["Platform Readiness", "Runtime Health", "Tenant Isolation", "Governance Review"],
    navigation: [
      { href: "/dashboard", label: "Zenith Mission", description: "Internal mission control", domain: "platform" },
      { href: "/mission-control", label: "Mission Control", description: "Platform mission control", domain: "platform" },
      { href: "/runtime-os", label: "Runtime OS", description: "Runtime health and recovery", domain: "automation" },
      { href: "/workflow-os", label: "Workflow OS", description: "Workflow registry and analytics", domain: "automation" },
      { href: "/internal", label: "Internal Ops", description: "Internal platform operations", domain: "platform" },
      { href: "/automation-center", label: "Automations", description: "Execute and observe workflows", domain: "automation" },
      { href: "/settings", label: "Settings", description: "Platform settings", domain: "operations" }
    ]
  }
};

export const defaultPersonaByRole: Record<ZenithRole, PersonaKey> = {
  practice_owner: "practice_owner",
  staff: "front_desk_operator",
  agency_admin: "agency_growth_operator",
  super_admin: "zenith_platform_operator"
};

export const rolePersonaOptions: Record<ZenithRole, PersonaKey[]> = {
  practice_owner: ["practice_owner", "dso_executive"],
  staff: ["front_desk_operator", "clinical_provider", "office_manager"],
  agency_admin: ["agency_growth_operator"],
  super_admin: ["zenith_platform_operator", "dso_executive", "agency_growth_operator", "practice_owner"]
};

export function getPersonaForRole(role: ZenithRole, requestedPersona?: PersonaKey | null) {
  const allowed = rolePersonaOptions[role];
  const selected = requestedPersona && allowed.includes(requestedPersona) ? requestedPersona : defaultPersonaByRole[role];
  return personas[selected];
}

export function getPersonaByKey(key: PersonaKey) {
  return personas[key];
}

export function getPersonaNavigationForRole(role: ZenithRole) {
  return getPersonaForRole(role).navigation;
}
