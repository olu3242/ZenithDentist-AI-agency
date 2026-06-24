import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  Brain,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  Clock,
  CloudCog,
  DatabaseZap,
  DollarSign,
  FileText,
  Gauge,
  GitBranch,
  GraduationCap,
  HeartPulse,
  KeyRound,
  LayoutDashboard,
  Network,
  PlayCircle,
  PlugZap,
  Radar,
  RefreshCw,
  Rocket,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Workflow,
  Store
} from "lucide-react";
import type { ZenithRole } from "@/lib/auth-routing";
import { getPersonaNavigationForRole, type MissionDomain } from "@/lib/personas";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  roles: ZenithRole[];
  icon: typeof Gauge;
}

export const appNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", description: "Staff KPI and executive operations dashboard", roles: ["staff", "agency_admin", "super_admin"], icon: BarChart3 },
  { href: "/dashboard/front-desk", label: "Front Desk", description: "Front desk patient and appointment operations", roles: ["staff", "agency_admin", "super_admin"], icon: CalendarCheck },
  { href: "/dashboard/provider", label: "Provider", description: "Provider revenue and treatment operations", roles: ["staff", "agency_admin", "super_admin"], icon: HeartPulse },
  { href: "/dashboard/office-manager", label: "Office Manager", description: "Office manager workflow and PMS operations", roles: ["staff", "agency_admin", "super_admin"], icon: ClipboardCheck },
  { href: "/dashboard/practice-owner", label: "Practice Owner", description: "Practice owner executive revenue dashboard", roles: ["practice_owner", "agency_admin", "super_admin"], icon: TrendingUp },
  { href: "/dashboard/pms", label: "PMS Ops", description: "Canonical PMS Operations Center", roles: ["staff", "agency_admin", "super_admin"], icon: PlugZap },
  { href: "/onboarding", label: "Onboarding", description: "First-user setup, organization activation, and portal handoff", roles: ["practice_owner", "staff", "agency_admin", "super_admin"], icon: ClipboardCheck },
  { href: "/portal", label: "Client Portal", description: "Practice owner revenue intelligence portal", roles: ["practice_owner", "super_admin"], icon: Gauge },
  { href: "/portal/onboarding", label: "Onboarding", description: "Practice launch and PMS readiness", roles: ["practice_owner", "staff", "super_admin"], icon: ClipboardCheck },
  { href: "/admin", label: "Admin CRM", description: "Agency leads, audits, bookings, ROI and analytics", roles: ["agency_admin", "super_admin"], icon: Users },
  { href: "/mission-control", label: "Mission Control", description: "Super admin automation command center", roles: ["super_admin"], icon: ShieldCheck },
  { href: "/workflow-os", label: "Workflow OS", description: "Registered automations, execution analytics and replay posture", roles: ["super_admin"], icon: Workflow },
  { href: "/runtime-os", label: "Runtime OS", description: "Runtime health, traces, incidents and recovery queue", roles: ["super_admin"], icon: Activity },
  { href: "/automation-marketplace", label: "Marketplace", description: "Install and manage dental automation packs", roles: ["practice_owner", "agency_admin", "super_admin"], icon: Store },
  { href: "/automation-center", label: "Automation Center", description: "Execute, pause, resume and observe automations", roles: ["practice_owner", "staff", "agency_admin", "super_admin"], icon: Workflow },
  { href: "/internal", label: "Internal Ops", description: "Internal platform operations workspace", roles: ["super_admin"], icon: Building2 },
  { href: "/internal/executive", label: "Executive", description: "Agency-wide executive command center", roles: ["super_admin"], icon: ShieldCheck },
  { href: "/internal/product-owner", label: "Product Owner", description: "Platform health, adoption, roadmap and release operations", roles: ["super_admin"], icon: Gauge },
  { href: "/internal/noc", label: "NOC", description: "Enterprise live operations and event feed", roles: ["super_admin"], icon: Activity },
  { href: "/internal/incidents", label: "Incidents", description: "Incident management, root cause and recovery tracking", roles: ["super_admin"], icon: AlertTriangle },
  { href: "/internal/sla", label: "SLA", description: "Client SLA, error budget and compliance center", roles: ["super_admin"], icon: Clock },
  { href: "/internal/debug", label: "Debug", description: "Debug and recovery center", roles: ["super_admin"], icon: DatabaseZap },
  { href: "/internal/evidence", label: "Evidence", description: "Enterprise evidence explorer", roles: ["super_admin"], icon: ClipboardCheck },
  { href: "/internal/certification", label: "Certification", description: "Enterprise go-live gates and readiness index", roles: ["super_admin"], icon: ShieldCheck },
  { href: "/internal/alice-traceability", label: "ALICE Trace", description: "ALICE decision traceability and outcomes", roles: ["super_admin"], icon: Brain },
  { href: "/internal/revenue-attribution", label: "Attribution", description: "Revenue attribution journey tracker", roles: ["super_admin"], icon: Wallet },
  { href: "/internal/customer-success", label: "Customer Success", description: "Client health, adoption, churn and expansion", roles: ["super_admin"], icon: HeartPulse },
  { href: "/internal/agency-crm", label: "Agency CRM", description: "Pipeline, clients, renewals and opportunities", roles: ["super_admin"], icon: BriefcaseBusiness },
  { href: "/internal/implementations", label: "Implementations", description: "Client implementation command center", roles: ["super_admin"], icon: Rocket },
  { href: "/internal/onboarding", label: "Client Onboarding", description: "Automated onboarding tasks and progress", roles: ["super_admin"], icon: ClipboardCheck },
  { href: "/internal/integrations-readiness", label: "Integration Readiness", description: "Implementation integration connection gates", roles: ["super_admin"], icon: PlugZap },
  { href: "/internal/training", label: "Training OS", description: "Role-based client training and certification", roles: ["super_admin"], icon: GraduationCap },
  { href: "/internal/adoption", label: "Adoption", description: "Client adoption, usage and expansion signals", roles: ["super_admin"], icon: Activity },
  { href: "/internal/go-live", label: "Go Live", description: "Go-live certification and success review automation", roles: ["super_admin"], icon: CalendarCheck },
  { href: "/internal/client-playbooks", label: "Client Playbooks", description: "Post-go-live operating playbooks and success procedures", roles: ["super_admin"], icon: BookOpenCheck },
  { href: "/internal/commercial-lockdown", label: "Commercial Lockdown", description: "Pricing, payment gates, scope control and revenue visibility", roles: ["super_admin"], icon: DollarSign },
  { href: "/internal/client-approvals", label: "Client Approvals", description: "Approve, suspend, revoke, activate and invite client platform users", roles: ["super_admin"], icon: KeyRound },
  { href: "/settings", label: "Settings", description: "Organization, user and routing preferences", roles: ["practice_owner", "staff", "agency_admin", "super_admin"], icon: Settings }
];

export const adminNavItems: NavItem[] = [
  { href: "/admin/leads", label: "Leads", description: "Prospect and client lead records", roles: ["agency_admin", "super_admin"], icon: Users },
  { href: "/admin/audits", label: "Audits", description: "Revenue audit submissions", roles: ["agency_admin", "super_admin"], icon: ClipboardList },
  { href: "/admin/bookings", label: "Bookings", description: "Strategy call and booking activity", roles: ["agency_admin", "super_admin"], icon: CalendarCheck },
  { href: "/admin/roi", label: "ROI", description: "ROI calculations and revenue leakage model", roles: ["agency_admin", "super_admin"], icon: Gauge },
  { href: "/admin/analytics", label: "Analytics", description: "Funnel and operational analytics", roles: ["agency_admin", "super_admin"], icon: BarChart3 }
];

export const portalNavItems: NavItem[] = [
  { href: "/portal/cloud", label: "Cloud", description: "Healthcare cloud state", roles: ["practice_owner", "super_admin"], icon: CloudCog },
  { href: "/portal/orchestration", label: "Orchestration", description: "Automation orchestration", roles: ["practice_owner", "super_admin"], icon: DatabaseZap },
  { href: "/portal/knowledge", label: "Knowledge", description: "Operational knowledge graph", roles: ["practice_owner", "super_admin"], icon: Network },
  { href: "/portal/forecasting", label: "Forecasting", description: "Predictive revenue trends", roles: ["practice_owner", "super_admin"], icon: Radar },
  { href: "/portal/integrations", label: "PMS", description: "Practice management integrations", roles: ["practice_owner", "super_admin"], icon: CloudCog },
  { href: "/portal/command", label: "Command", description: "Practice command layer", roles: ["practice_owner", "super_admin"], icon: ShieldCheck },
  { href: "/portal/alice", label: "ALICE", description: "Operational intelligence assistant", roles: ["practice_owner", "super_admin"], icon: Brain },
  { href: "/portal/dashboard", label: "Portal Dashboard", description: "Client-facing dashboard", roles: ["practice_owner", "super_admin"], icon: LayoutDashboard },
  { href: "/portal/revenue", label: "Revenue", description: "Recovered revenue and reports", roles: ["practice_owner", "super_admin"], icon: RefreshCw },
  { href: "/portal/patients", label: "Patients", description: "Patient health and recall risk", roles: ["practice_owner", "super_admin"], icon: HeartPulse },
  { href: "/portal/reviews", label: "Reviews", description: "Review generation and sentiment", roles: ["practice_owner", "super_admin"], icon: Star },
  { href: "/portal/recall", label: "Recall", description: "Recall recovery pipeline", roles: ["practice_owner", "super_admin"], icon: RefreshCw },
  { href: "/portal/locations", label: "Locations", description: "Multi-location performance", roles: ["practice_owner", "super_admin"], icon: Building2 },
  { href: "/portal/reports", label: "Reports", description: "Executive reporting", roles: ["practice_owner", "super_admin"], icon: FileText },
  { href: "/portal/video", label: "Video Intelligence", description: "Video Engagement OS, patient journeys, attention scores and attribution", roles: ["practice_owner", "super_admin"], icon: PlayCircle },
  { href: "/portal/treatment-visualization", label: "Treatment Visualization", description: "Treatment education journey, engagement, and acceptance revenue", roles: ["practice_owner", "super_admin"], icon: BookOpenCheck },
  { href: "/portal/simulations", label: "Simulations", description: "Operational scenario modeling", roles: ["practice_owner", "super_admin"], icon: SlidersHorizontal }
];

export const internalNavItems: NavItem[] = [
  { href: "/internal/mission-control", label: "Internal Mission", description: "Internal mission control", roles: ["super_admin"], icon: Target },
  { href: "/internal/runtime-health", label: "Runtime Health", description: "Internal runtime health", roles: ["super_admin"], icon: Activity },
  { href: "/internal/automation-audit", label: "E2E Audit", description: "Automation audit", roles: ["super_admin"], icon: ClipboardCheck },
  { href: "/internal/events", label: "Events", description: "Event lineage", roles: ["super_admin"], icon: Network },
  { href: "/internal/grounding", label: "Grounding", description: "AI grounding controls", roles: ["super_admin"], icon: Target },
  { href: "/internal/resilience", label: "Resilience", description: "Operational resilience", roles: ["super_admin"], icon: ShieldCheck },
  { href: "/internal/replays", label: "Replays", description: "Replay console", roles: ["super_admin"], icon: RefreshCw },
  { href: "/internal/intelligence", label: "Intelligence", description: "Intelligence benchmarks", roles: ["super_admin"], icon: Brain },
  { href: "/internal/accuracy", label: "Accuracy", description: "Simulation accuracy and drift", roles: ["super_admin"], icon: TrendingUp },
  { href: "/internal/confidence", label: "Confidence", description: "AI confidence scoring", roles: ["super_admin"], icon: Gauge },
  { href: "/internal/simulations", label: "Sim Accuracy", description: "Simulation accuracy lab", roles: ["super_admin"], icon: Activity },
  { href: "/internal/cloud", label: "Cloud", description: "Enterprise cloud", roles: ["super_admin"], icon: CloudCog },
  { href: "/internal/orchestration", label: "Orchestration", description: "Orchestration graph", roles: ["super_admin"], icon: DatabaseZap },
  { href: "/internal/integrations", label: "PMS", description: "PMS integrations", roles: ["super_admin"], icon: PlugZap },
  { href: "/internal/governance", label: "Governance", description: "Governance controls", roles: ["super_admin"], icon: ShieldCheck },
  { href: "/internal/platform", label: "Platform", description: "Platform readiness", roles: ["super_admin"], icon: ShieldCheck },
  { href: "/internal/production-certification", label: "Certification", description: "Production evidence, claim governance, connector proof, and role workspace certification", roles: ["super_admin"], icon: ShieldCheck },
  { href: "/internal/ai", label: "ALICE", description: "AI operations", roles: ["super_admin"], icon: Brain },
  { href: "/internal/playbooks", label: "Playbooks", description: "Operational playbooks", roles: ["super_admin"], icon: GitBranch },
  { href: "/internal/operations", label: "Operations", description: "Operations center", roles: ["super_admin"], icon: Activity },
  { href: "/internal/recommendations", label: "Recommendations", description: "Recommendations queue", roles: ["super_admin"], icon: ClipboardList },
  { href: "/internal/organizations", label: "Organizations", description: "Tenant inventory", roles: ["super_admin"], icon: Building2 },
  { href: "/internal/health", label: "Health", description: "Client health", roles: ["super_admin"], icon: Gauge },
  { href: "/internal/benchmarks", label: "Benchmarks", description: "Benchmarks and cohorts", roles: ["super_admin"], icon: BarChart3 },
  { href: "/internal/revenue", label: "Revenue", description: "Revenue intelligence", roles: ["super_admin"], icon: Wallet },
  { href: "/internal/platform-metrics", label: "Platform Metrics", description: "Platform KPIs", roles: ["super_admin"], icon: Gauge },
  { href: "/internal/implementations", label: "Implementations", description: "Client implementation command center", roles: ["super_admin"], icon: Rocket },
  { href: "/internal/onboarding", label: "Client Onboarding", description: "Automated onboarding tasks", roles: ["super_admin"], icon: ClipboardCheck },
  { href: "/internal/integrations-readiness", label: "Readiness", description: "Integration readiness gates", roles: ["super_admin"], icon: PlugZap },
  { href: "/internal/training", label: "Training", description: "Client training OS", roles: ["super_admin"], icon: GraduationCap },
  { href: "/internal/adoption", label: "Adoption", description: "Adoption and health signals", roles: ["super_admin"], icon: Activity },
  { href: "/internal/go-live", label: "Go Live", description: "Go-live certification", roles: ["super_admin"], icon: CalendarCheck },
  { href: "/internal/client-playbooks", label: "Client Playbooks", description: "Post-go-live client operating playbooks", roles: ["super_admin"], icon: BookOpenCheck },
  { href: "/internal/commercial-lockdown", label: "Commercial", description: "Payment gates and commercial controls", roles: ["super_admin"], icon: DollarSign },
  { href: "/internal/client-approvals", label: "Client Approvals", description: "Access approval, suspension, revocation and invitation controls", roles: ["super_admin"], icon: KeyRound },
  { href: "/lead-operations", label: "Lead Ops", description: "Lead operations workspace", roles: ["agency_admin", "super_admin"], icon: GitBranch },
  { href: "/client-operations", label: "Client Ops", description: "Client delivery operations", roles: ["agency_admin", "super_admin"], icon: Users },
  { href: "/gtm-command-center", label: "GTM Command", description: "Growth and delivery command center", roles: ["agency_admin", "super_admin"], icon: Target }
];

export function navForRole(role: ZenithRole) {
  return {
    primary: getPersonaNavigationForRole(role).map(item => ({
      href: item.href,
      label: item.label,
      description: item.description,
      roles: [role],
      icon: iconForDomain(item.domain)
    })),
    admin: adminNavItems.filter(item => item.roles.includes(role)),
    portal: portalNavItems.filter(item => item.roles.includes(role)),
    internal: internalNavItems.filter(item => item.roles.includes(role))
  };
}

function iconForDomain(domain: MissionDomain) {
  return {
    automation: Workflow,
    enterprise: Building2,
    operations: ClipboardCheck,
    patients: HeartPulse,
    platform: ShieldCheck,
    revenue: TrendingUp
  }[domain];
}
