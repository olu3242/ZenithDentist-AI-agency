import type { Organization } from "@/lib/data/tenants";
import { localeLabels, supportedCurrencies, supportedLocales } from "@/lib/i18n/config";

export function OrganizationSettings({ organization }: { organization: Organization }) {
  const settings = organization.settings as Record<string, unknown>;
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Operational Configuration</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded bg-paper p-4">
          <p className="text-xs font-black uppercase tracking-wider text-muted">Default locale</p>
          <strong className="mt-2 block text-sm">{localeLabels[(organization.default_locale as keyof typeof localeLabels) ?? "en-US"] ?? organization.default_locale}</strong>
          <p className="mt-2 text-xs font-semibold text-muted">{supportedLocales.join(" · ")}</p>
        </div>
        <div className="rounded bg-paper p-4">
          <p className="text-xs font-black uppercase tracking-wider text-muted">Default currency</p>
          <strong className="mt-2 block text-sm">{organization.default_currency}</strong>
          <p className="mt-2 text-xs font-semibold text-muted">{supportedCurrencies.join(" · ")}</p>
        </div>
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
