"use client";
import { Activity, Building2, Gauge, LineChart, Wallet, Brain, ClipboardList, GitBranch, ShieldCheck, CloudCog, DatabaseZap, PlugZap, RadioTower, History, Target, ShieldAlert, Network, TrendingUp, ListChecks } from "lucide-react";
import { BrandSidebar } from "@/components/brand";
import type { NavItem } from "@/components/brand";

const nav: NavItem[] = [
  { href: "/internal/mission-control",  label: "Mission Control",  icon: RadioTower },
  { href: "/internal/runtime-health",   label: "Runtime Health",   icon: ShieldAlert },
  { href: "/internal/automation-audit", label: "E2E Audit",        icon: ListChecks },
  { href: "/internal/events",           label: "Events",           icon: Network },
  { href: "/internal/grounding",        label: "Grounding",        icon: Target },
  { href: "/internal/resilience",       label: "Resilience",       icon: ShieldAlert },
  { href: "/internal/replays",          label: "Replays",          icon: History },
  { href: "/internal/intelligence",     label: "Intelligence",     icon: Brain },
  { href: "/internal/accuracy",         label: "Accuracy",         icon: TrendingUp },
  { href: "/internal/confidence",       label: "Confidence",       icon: Gauge },
  { href: "/internal/simulations",      label: "Sim Accuracy",     icon: Activity },
  { href: "/internal/cloud",            label: "Cloud",            icon: CloudCog },
  { href: "/internal/orchestration",    label: "Orchestration",    icon: DatabaseZap },
  { href: "/internal/integrations",     label: "PMS",              icon: PlugZap },
  { href: "/internal/governance",       label: "Governance",       icon: ShieldCheck },
  { href: "/internal/platform",         label: "Platform",         icon: ShieldCheck },
  { href: "/internal/ai",               label: "ALICE",            icon: Brain },
  { href: "/internal/playbooks",        label: "Playbooks",        icon: GitBranch },
  { href: "/internal/operations",       label: "Operations",       icon: Activity },
  { href: "/internal/recommendations",  label: "Recommendations",  icon: ClipboardList },
  { href: "/internal/organizations",    label: "Organizations",    icon: Building2 },
  { href: "/internal/health",           label: "Health",           icon: Gauge },
  { href: "/internal/benchmarks",       label: "Benchmarks",       icon: LineChart },
  { href: "/internal/revenue",          label: "Revenue",          icon: Wallet },
  { href: "/internal/platform-metrics", label: "Platform Metrics", icon: Activity },
];

export function InternalSidebar() {
  return (
    <BrandSidebar
      submark="internal"
      subtitle="Platform operations"
      href="/internal/organizations"
      nav={nav}
    />
  );
}
