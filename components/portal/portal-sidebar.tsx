"use client";
import { BarChart3, Gauge, HeartPulse, RefreshCw, Settings, Star, FileText, Building2, ClipboardCheck, Brain, ShieldCheck, SlidersHorizontal, CloudCog, Network, Radar, DatabaseZap } from "lucide-react";
import { BrandSidebar } from "@/components/brand";
import type { NavItem } from "@/components/brand";

const nav: NavItem[] = [
  { href: "/portal",               label: "Overview",      icon: Gauge },
  { href: "/portal/cloud",         label: "Cloud",         icon: CloudCog },
  { href: "/portal/orchestration", label: "Orchestration", icon: DatabaseZap },
  { href: "/portal/knowledge",     label: "Knowledge",     icon: Network },
  { href: "/portal/forecasting",   label: "Forecasting",   icon: Radar },
  { href: "/portal/integrations",  label: "PMS",           icon: CloudCog },
  { href: "/portal/command",       label: "Command",       icon: ShieldCheck },
  { href: "/portal/alice",         label: "ALICE",         icon: Brain },
  { href: "/portal/dashboard",     label: "Dashboard",     icon: BarChart3 },
  { href: "/portal/revenue",       label: "Revenue",       icon: RefreshCw },
  { href: "/portal/patients",      label: "Patients",      icon: HeartPulse },
  { href: "/portal/reviews",       label: "Reviews",       icon: Star },
  { href: "/portal/recall",        label: "Recall",        icon: RefreshCw },
  { href: "/portal/locations",     label: "Locations",     icon: Building2 },
  { href: "/portal/reports",       label: "Reports",       icon: FileText },
  { href: "/portal/simulations",   label: "Simulations",   icon: SlidersHorizontal },
  { href: "/portal/onboarding",    label: "Onboarding",    icon: ClipboardCheck },
  { href: "/portal/settings",      label: "Settings",      icon: Settings },
];

export function PortalSidebar({ unread }: { unread: number }) {
  const navWithBadge = nav.map(item =>
    item.label === "Overview" ? { ...item, badge: unread } : item
  );
  return (
    <BrandSidebar
      submark="portal"
      subtitle="Healthcare cloud"
      href="/portal"
      nav={navWithBadge}
    />
  );
}
