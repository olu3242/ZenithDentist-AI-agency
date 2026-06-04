import { type ZenithRole } from "@/lib/auth-routing";
import type { Organization, Location } from "@/lib/data/tenants";
import { PortalShell } from "@/components/app/portal-shell";
import { getLocale } from "next-intl/server";
import { normalizeLocale } from "@/lib/i18n/config";

export async function AppShell({
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
  const locale = normalizeLocale(await getLocale());

  return (
    <PortalShell role={role} organization={organization} locations={locations} unread={unread} locale={locale}>
      {children}
    </PortalShell>
  );
}
