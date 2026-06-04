import Link from "next/link";
import { Bell, ChevronDown, LogOut, UserCircle } from "lucide-react";
import { logoutAction } from "@/app/auth-actions";
import { ZenithLogo } from "@/components/branding/ZenithLogo";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { OfflineState } from "@/components/ui/canonical";
import { brandConfig } from "@/lib/brand";
import { getDefaultPortalForRole, roleLabel, type ZenithRole } from "@/lib/auth-routing";
import { navForRole } from "@/lib/navigation";
import type { Location, Organization } from "@/lib/data/tenants";
import { BackgroundWatermark } from "@/components/app/background-watermark";
import { ShellBreadcrumbs } from "@/components/app/shell-breadcrumbs";
import { localeLabels, type SupportedLocale } from "@/lib/i18n/config";

export function PortalShell({
  role,
  organization,
  locations,
  unread = 0,
  locale,
  children
}: {
  role: ZenithRole;
  organization: Organization;
  locations: Location[];
  unread?: number;
  locale: SupportedLocale;
  children: React.ReactNode;
}) {
  const nav = navForRole(role);
  const defaultPortal = getDefaultPortalForRole(role);

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="relative z-20 border-r border-white/10 bg-ink p-4 text-white lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:p-5">
        <ZenithLogo href={defaultPortal} subtitle={roleLabel(role)} mutedClassName="text-white/55" textClassName="text-white" />

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

        <div className="mt-3 rounded border border-white/10 bg-white/8 p-3">
          <p className="text-xs font-black uppercase tracking-wider text-white/45">Locale</p>
          <p className="mt-1 text-sm font-bold text-white">{localeLabels[locale]}</p>
          <p className="text-xs font-semibold text-white/50">{organization.default_currency ?? "USD"}</p>
        </div>

        <nav className="mt-6 grid gap-5" aria-label="Application navigation">
          <NavGroup title="Primary" items={nav.primary} />
          {nav.admin.length ? <NavGroup title="Admin" items={nav.admin} /> : null}
          {nav.portal.length ? <NavGroup title="Portal" items={nav.portal} /> : null}
          {nav.internal.length ? <NavGroup title="Operations" items={nav.internal} /> : null}
        </nav>
      </aside>

      <div className="relative min-w-0">
        <BackgroundWatermark />
        <div className="relative z-10 min-h-screen">
          <OfflineState />
          <header className="sticky top-0 z-30 border-b border-line bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wider text-teal">{brandConfig.name}</p>
                <strong className="block truncate text-sm text-ink">{organization.name}</strong>
                <div className="mt-2">
                  <ShellBreadcrumbs />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <LocaleSwitcher currentLocale={locale} compact />
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
                    <span className="hidden sm:inline">{roleLabel(role)}</span>
                    <ChevronDown className="h-4 w-4" />
                  </summary>
                  <div className="absolute right-0 mt-2 w-64 rounded border border-line bg-white p-3 shadow-lg">
                    <p className="text-xs font-black uppercase tracking-wider text-muted">Signed-in role</p>
                    <strong className="mt-1 block text-sm">{roleLabel(role)}</strong>
                    <Link href="/settings" className="mt-3 flex items-center gap-2 rounded bg-paper px-3 py-2 text-sm font-bold text-ink">
                      Settings
                    </Link>
                    <form action={logoutAction}>
                      <button type="submit" className="mt-2 flex w-full items-center gap-2 rounded bg-paper px-3 py-2 text-left text-sm font-bold text-muted">
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </form>
                  </div>
                </details>
              </div>
            </div>
          </header>
          <main className="px-4 py-5 lg:px-8 lg:py-8">{children}</main>
        </div>
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
          <Link key={item.href} href={item.href} className="flex min-w-0 items-center gap-3 rounded px-3 py-2 text-sm font-bold text-white/72 hover:bg-white/10 hover:text-white" title={item.description}>
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
