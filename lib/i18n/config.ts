export const supportedLocales = ["en-US", "es-US", "en-CA", "fr-CA"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const supportedCurrencies = ["USD", "CAD"] as const;
export type SupportedCurrency = (typeof supportedCurrencies)[number];

export const defaultLocale: SupportedLocale = "en-US";
export const defaultCurrency: SupportedCurrency = "USD";

export const localeLabels: Record<SupportedLocale, string> = {
  "en-US": "English (US)",
  "es-US": "Español (US)",
  "en-CA": "English (Canada)",
  "fr-CA": "Français (Canada)"
};

export const localeCurrency: Record<SupportedLocale, SupportedCurrency> = {
  "en-US": "USD",
  "es-US": "USD",
  "en-CA": "CAD",
  "fr-CA": "CAD"
};

export const localeTimeZone: Record<SupportedLocale, string> = {
  "en-US": "America/Chicago",
  "es-US": "America/Chicago",
  "en-CA": "America/Toronto",
  "fr-CA": "America/Toronto"
};

export function isSupportedLocale(value: string | undefined | null): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}

export function isSupportedCurrency(value: string | undefined | null): value is SupportedCurrency {
  return supportedCurrencies.includes(value as SupportedCurrency);
}

export function currencyForLocale(locale: string | undefined | null): SupportedCurrency {
  return isSupportedLocale(locale) ? localeCurrency[locale] : defaultCurrency;
}

export function normalizeLocale(value: string | undefined | null): SupportedLocale {
  return isSupportedLocale(value) ? value : defaultLocale;
}

export function localePath(pathname: string, locale: SupportedLocale) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const [, first, ...rest] = normalized.split("/");
  const suffix = isSupportedLocale(first) ? `/${rest.join("/")}` : normalized;
  const cleanSuffix = suffix === "/" ? "" : suffix;
  return `/${locale}${cleanSuffix || "/"}`.replace(/\/$/, cleanSuffix ? "" : "/");
}
