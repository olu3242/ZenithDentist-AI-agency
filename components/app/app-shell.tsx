import { type ZenithRole } from "@/lib/auth-routing";
import type { Organization, Location } from "@/lib/data/tenants";
import { PortalShell } from "@/components/app/portal-shell";

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
  return (
    <PortalShell role={role} organization={organization} locations={locations} unread={unread}>
      {children}
    </PortalShell>
  );
}
