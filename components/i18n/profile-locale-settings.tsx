import { getLocale } from "next-intl/server";
import { defaultCurrencyForLocale } from "@/lib/currency";
import { localeLabels, localeTimeZone, normalizeLocale, supportedCurrencies, supportedLocales } from "@/lib/i18n/config";

export async function ProfileLocaleSettings() {
  const locale = normalizeLocale(await getLocale());
  const currency = defaultCurrencyForLocale(locale);
  const timezone = localeTimeZone[locale];

  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Profile Localization</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Preference label="Locale" value={localeLabels[locale]} helper={supportedLocales.join(" · ")} />
        <Preference label="Timezone" value={timezone} helper="Stored on profiles.timezone" />
        <Preference label="Currency" value={currency} helper={supportedCurrencies.join(" · ")} />
      </div>
    </section>
  );
}

function Preference({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded bg-paper p-4">
      <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      <strong className="mt-2 block text-sm">{value}</strong>
      <p className="mt-2 text-xs font-semibold text-muted">{helper}</p>
    </div>
  );
}
