import { formatMoney } from "@/lib/currency";
import { defaultLocale, localeCurrency, normalizeLocale, type SupportedCurrency, type SupportedLocale } from "@/lib/i18n/config";
import enUS from "@/messages/en-US.json";
import esUS from "@/messages/es-US.json";
import enCA from "@/messages/en-CA.json";
import frCA from "@/messages/fr-CA.json";

const catalogs = {
  "en-US": enUS,
  "es-US": esUS,
  "en-CA": enCA,
  "fr-CA": frCA
} satisfies Record<SupportedLocale, typeof enUS>;

export type LocalizationContext = {
  locale?: string | null;
  currency?: string | null;
};

export function getLocalizedText(path: string, ctx: LocalizationContext = {}, values: Record<string, string | number> = {}) {
  const locale = normalizeLocale(ctx.locale ?? defaultLocale);
  const catalog = catalogs[locale];
  const template = path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) return (current as Record<string, unknown>)[key];
    return undefined;
  }, catalog);
  const text = typeof template === "string" ? template : path;
  return Object.entries(values).reduce((body, [key, value]) => body.replaceAll(`{${key}}`, String(value)), text);
}

export function getLocalizedCurrency(value: number, ctx: LocalizationContext = {}) {
  const locale = normalizeLocale(ctx.locale ?? defaultLocale);
  return formatMoney({
    amount: value,
    locale,
    currency: ctx.currency ?? localeCurrency[locale]
  });
}

export function buildLocalizedAliceBriefing(ctx: LocalizationContext = {}) {
  const locale = normalizeLocale(ctx.locale ?? defaultLocale);
  const currency = (ctx.currency ?? localeCurrency[locale]) as SupportedCurrency;
  return getLocalizedText("alice.localizedBriefing", { locale, currency }, { locale, currency });
}

export function buildLocalizedSms(template: "assessmentReady" | "bookingReminder", ctx: LocalizationContext = {}) {
  return getLocalizedText(`sms.${template}`, ctx);
}
