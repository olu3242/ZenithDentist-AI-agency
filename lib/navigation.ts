import {
  Activity,
  BarChart3,
  Brain,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  CloudCog,
  DatabaseZap,
  FileText,
  Gauge,
  GitBranch,
  HeartPulse,
  LayoutDashboard,
  Network,
  PlugZap,
  Radar,
  RefreshCw,
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

export interface NavItem {
  href: string;
  label: string;
  description: string;
  roles: ZenithRole[];
  icon: typeof Gauge;
}

export const appNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", description: "Staff KPI and executive operations dashboard", roles: ["staff", "agency_admin", "super_admin"], icon: BarChart3 },
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
  { href: "/internal/ai", label: "ALICE", description: "AI operations", roles: ["super_admin"], icon: Brain },
  { href: "/internal/playbooks", label: "Playbooks", description: "Operational playbooks", roles: ["super_admin"], icon: GitBranch },
  { href: "/internal/operations", label: "Operations", description: "Operations center", roles: ["super_admin"], icon: Activity },
  { href: "/internal/recommendations", label: "Recommendations", description: "Recommendations queue", roles: ["super_admin"], icon: ClipboardList },
  { href: "/internal/organizations", label: "Organizations", description: "Tenant inventory", roles: ["super_admin"], icon: Building2 },
  { href: "/internal/health", label: "Health", description: "Client health", roles: ["super_admin"], icon: Gauge },
  { href: "/internal/benchmarks", label: "Benchmarks", description: "Benchmarks and cohorts", roles: ["super_admin"], icon: BarChart3 },
  { href: "/internal/revenue", label: "Revenue", description: "Revenue intelligence", roles: ["super_admin"], icon: Wallet },
  { href: "/internal/platform-metrics", label: "Platform Metrics", description: "Platform KPIs", roles: ["super_admin"], icon: Gauge },
  { href: "/lead-operations", label: "Lead Ops", description: "Lead operations workspace", roles: ["agency_admin", "super_admin"], icon: GitBranch },
  { href: "/client-operations", label: "Client Ops", description: "Client delivery operations", roles: ["agency_admin", "super_admin"], icon: Users },
  { href: "/gtm-command-center", label: "GTM Command", description: "Growth and delivery command center", roles: ["agency_admin", "super_admin"], icon: Target }
];

export function navForRole(role: ZenithRole) {
  return {
    primary: appNavItems.filter(item => item.roles.includes(role)),
    admin: adminNavItems.filter(item => item.roles.includes(role)),
    portal: portalNavItems.filter(item => item.roles.includes(role)),
    internal: internalNavItems.filter(item => item.roles.includes(role))
  };
}
