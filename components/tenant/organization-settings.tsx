import type { Organization } from "@/lib/data/tenants";

export function OrganizationSettings({ organization }: { organization: Organization }) {
  const settings = organization.settings as Record<string, unknown>;
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Operational Configuration</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="rounded bg-paper p-4">
            <p className="text-xs font-black uppercase tracking-wider text-muted">{key.replace(/([A-Z])/g, " $1")}</p>
            <strong className="mt-2 block break-words text-sm">{JSON.stringify(value)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
