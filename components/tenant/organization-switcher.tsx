import type { Organization, Location } from "@/lib/data/tenants";

export function OrganizationSwitcher({ organization, locations }: { organization: Organization; locations: Location[] }) {
  return (
    <div className="rounded border border-card bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Organization</p>
      <strong className="mt-1 block text-lg">{organization.name}</strong>
      <div className="mt-3 grid gap-2">
        {locations.map(location => (
          <div key={location.id} className="flex items-center justify-between rounded bg-background px-3 py-2 text-sm">
            <span>{location.name}</span>
            <span className="font-bold text-muted">{location.chair_count} chairs</span>
          </div>
        ))}
      </div>
    </div>
  );
}
