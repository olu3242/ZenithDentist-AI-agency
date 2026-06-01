import Link from "next/link";
import { BarChart3, CalendarCheck, ClipboardList, Gauge, LayoutDashboard, Users } from "lucide-react";
import { GlobalBrandLogo } from "@/components/branding/GlobalBrandLogo";

const items = [
  { href: "/admin", label: "Command", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/audits", label: "Audits", icon: ClipboardList },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/roi", label: "ROI", icon: Gauge },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 }
];

export function AdminSidebar() {
  return (
    <aside className="border-r border-white/10 bg-ink p-5 text-white lg:min-h-screen">
      <GlobalBrandLogo href="/admin" subtitle="Revenue command center" mutedClassName="text-white/55" />
      <nav className="mt-8 grid gap-2">
        {items.map(item => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded px-3 py-2 text-sm font-bold text-white/72 hover:bg-white/10 hover:text-white">
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
