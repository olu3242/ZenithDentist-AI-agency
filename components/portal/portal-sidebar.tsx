import Link from "next/link";
import { Bell, BarChart3, Gauge, HeartPulse, RefreshCw, Settings, Star, FileText, Building2, ClipboardCheck, Brain, ShieldCheck, SlidersHorizontal } from "lucide-react";

const nav = [
  { href: "/portal", label: "Overview", icon: Gauge },
  { href: "/portal/command", label: "Command", icon: ShieldCheck },
  { href: "/portal/alice", label: "ALICE", icon: Brain },
  { href: "/portal/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/portal/revenue", label: "Revenue", icon: RefreshCw },
  { href: "/portal/patients", label: "Patients", icon: HeartPulse },
  { href: "/portal/reviews", label: "Reviews", icon: Star },
  { href: "/portal/recall", label: "Recall", icon: RefreshCw },
  { href: "/portal/locations", label: "Locations", icon: Building2 },
  { href: "/portal/reports", label: "Reports", icon: FileText },
  { href: "/portal/simulations", label: "Simulations", icon: SlidersHorizontal },
  { href: "/portal/onboarding", label: "Onboarding", icon: ClipboardCheck },
  { href: "/portal/settings", label: "Settings", icon: Settings }
];

export function PortalSidebar({ unread }: { unread: number }) {
  return (
    <aside className="border-r border-white/10 bg-ink p-5 text-white lg:min-h-screen">
      <Link href="/portal" className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded bg-teal font-black">Z</span>
        <span>
          <strong className="block">ZENITH PORTAL</strong>
          <small className="text-white/55">AI operations layer</small>
        </span>
      </Link>
      <div className="mt-6 flex items-center justify-between rounded border border-white/10 bg-white/8 p-3">
        <span className="text-sm font-bold text-white/75">Notifications</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-teal px-2 py-1 text-xs font-black">
          <Bell className="h-3 w-3" />
          {unread}
        </span>
      </div>
      <nav className="mt-6 grid gap-2">
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
