import type { Location } from "@/lib/data/tenants";

export function MultiLocationGrid({ locations }: { locations: Location[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {locations.map(location => (
        <article key={location.id} className="rounded border border-line bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-muted">{location.is_primary ? "Primary location" : "Location"}</p>
          <h3 className="mt-2 text-xl font-black">{location.name}</h3>
          <p className="mt-2 text-muted">{location.chair_count} chairs · {location.timezone}</p>
        </article>
      ))}
    </div>
  );
}
