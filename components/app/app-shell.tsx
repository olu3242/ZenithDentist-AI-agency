import Link from "next/link";
import { Bell, ChevronDown, LogOut, UserCircle } from "lucide-react";
import { getDefaultPortalForRole, roleLabel, type ZenithRole } from "@/lib/auth-routing";
import { navForRole } from "@/lib/navigation";
import type { Organization, Location } from "@/lib/data/tenants";
import { GlobalBrandLogo } from "@/components/branding/GlobalBrandLogo";
import { brandConfig } from "@/lib/brand";

export function AppShell({
  role,
  organization,
  locations,
  unread = 0,
  children
}: {
  role: ZenithRole;
  organization: Organization;
  locations: Location[];
  unread?: number;
  children: React.ReactNode;
}) {
  const nav = navForRole(role);
  const defaultPortal = getDefaultPortalForRole(role);

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-white/10 bg-ink p-5 text-white lg:min-h-screen">
        <GlobalBrandLogo href={defaultPortal} subtitle={roleLabel(role)} mutedClassName="text-white/55" />

        <div className="mt-6 rounded border border-white/10 bg-white/8 p-3">
          <p className="text-xs font-black uppercase tracking-wider text-white/45">Organization</p>
          <label className="sr-only" htmlFor="organization-switcher">Organization</label>
          <select id="organization-switcher" className="mt-2 w-full rounded border border-white/10 bg-ink px-3 py-2 text-sm font-bold text-white">
            <option>{organization.name}</option>
            {locations.map(location => (
              <option key={location.id}>{location.name}</option>
            ))}
          </select>
        </div>

        <nav className="mt-6 grid gap-5" aria-label="Application navigation">
          <NavGroup title="Primary" items={nav.primary} />
          {nav.admin.length ? <NavGroup title="Admin" items={nav.admin} /> : null}
          {nav.portal.length ? <NavGroup title="Portal" items={nav.portal} /> : null}
          {nav.internal.length ? <NavGroup title="Operations" items={nav.internal} /> : null}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-line bg-white/95 px-5 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-teal">{brandConfig.name}</p>
              <strong className="block text-sm text-ink">{organization.name}</strong>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/portal-select" className="hidden rounded border border-line px-3 py-2 text-xs font-black text-muted hover:bg-paper md:inline-flex">
                Portal Selector
              </Link>
              <span className="inline-flex items-center gap-1 rounded border border-line bg-paper px-3 py-2 text-xs font-black text-muted">
                <Bell className="h-3.5 w-3.5" />
                {unread}
              </span>
              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm font-bold text-ink">
                  <UserCircle className="h-4 w-4" />
                  {roleLabel(role)}
                  <ChevronDown className="h-4 w-4" />
                </summary>
                <div className="absolute right-0 mt-2 w-64 rounded border border-line bg-white p-3 shadow-lg">
                  <p className="text-xs font-black uppercase tracking-wider text-muted">Signed-in role</p>
                  <strong className="mt-1 block text-sm">{roleLabel(role)}</strong>
                  <Link href="/settings" className="mt-3 flex items-center gap-2 rounded bg-paper px-3 py-2 text-sm font-bold text-ink">
                    Settings
                  </Link>
                  <Link href="/?logout=manual" className="mt-2 flex items-center gap-2 rounded bg-paper px-3 py-2 text-sm font-bold text-muted">
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Link>
                </div>
              </details>
            </div>
          </div>
        </header>
        <main className="p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavGroup({ title, items }: { title: string; items: ReturnType<typeof navForRole>["primary"] }) {
  return (
    <section>
      <p className="px-3 text-xs font-black uppercase tracking-wider text-white/40">{title}</p>
      <div className="mt-2 grid gap-1">
        {items.map(item => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded px-3 py-2 text-sm font-bold text-white/72 hover:bg-white/10 hover:text-white" title={item.description}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
