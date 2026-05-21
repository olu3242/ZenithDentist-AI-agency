import Link from "next/link";
import { Activity, Building2, Gauge, LineChart, Wallet, Brain, ClipboardList, GitBranch, ShieldCheck, CloudCog, DatabaseZap, PlugZap, RadioTower, History, Target, ShieldAlert, Network, TrendingUp, ListChecks } from "lucide-react";

const nav = [
  { href: "/internal/mission-control", label: "Mission Control", icon: RadioTower },
  { href: "/internal/runtime-health", label: "Runtime Health", icon: ShieldAlert },
  { href: "/internal/automation-audit", label: "E2E Audit", icon: ListChecks },
  { href: "/internal/events", label: "Events", icon: Network },
  { href: "/internal/grounding", label: "Grounding", icon: Target },
  { href: "/internal/resilience", label: "Resilience", icon: ShieldAlert },
  { href: "/internal/replays", label: "Replays", icon: History },
  { href: "/internal/intelligence", label: "Intelligence", icon: Brain },
  { href: "/internal/accuracy", label: "Accuracy", icon: TrendingUp },
  { href: "/internal/confidence", label: "Confidence", icon: Gauge },
  { href: "/internal/simulations", label: "Sim Accuracy", icon: Activity },
  { href: "/internal/cloud", label: "Cloud", icon: CloudCog },
  { href: "/internal/orchestration", label: "Orchestration", icon: DatabaseZap },
  { href: "/internal/integrations", label: "PMS", icon: PlugZap },
  { href: "/internal/governance", label: "Governance", icon: ShieldCheck },
  { href: "/internal/platform", label: "Platform", icon: ShieldCheck },
  { href: "/internal/ai", label: "ALICE", icon: Brain },
  { href: "/internal/playbooks", label: "Playbooks", icon: GitBranch },
  { href: "/internal/operations", label: "Operations", icon: Activity },
  { href: "/internal/recommendations", label: "Recommendations", icon: ClipboardList },
  { href: "/internal/organizations", label: "Organizations", icon: Building2 },
  { href: "/internal/health", label: "Health", icon: Gauge },
  { href: "/internal/benchmarks", label: "Benchmarks", icon: LineChart },
  { href: "/internal/revenue", label: "Revenue", icon: Wallet },
  { href: "/internal/platform-metrics", label: "Platform Metrics", icon: Activity }
];

export function InternalSidebar() {
  return (
    <aside className="border-r border-white/10 bg-ink p-5 text-white lg:min-h-screen">
      <Link href="/internal/organizations" className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded bg-gold font-black">Z</span>
        <span>
          <strong className="block">ZENITH INTERNAL</strong>
          <small className="text-white/55">Platform operations</small>
        </span>
      </Link>
      <nav className="mt-8 grid gap-2">
        {nav.map(item => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded px-3 py-2 text-sm font-bold text-white/72 hover:bg-white/10 hover:text-white">
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
