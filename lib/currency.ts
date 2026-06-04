import { currencyForLocale, defaultCurrency, defaultLocale, isSupportedCurrency, normalizeLocale, type SupportedCurrency, type SupportedLocale } from "@/lib/i18n/config";

export type MoneyInput = {
  amount: number;
  locale?: string | null;
  currency?: string | null;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

export function resolveCurrency(locale?: string | null, currency?: string | null): SupportedCurrency {
  if (isSupportedCurrency(currency)) return currency;
  return currencyForLocale(locale);
}

export function formatMoney({
  amount,
  locale = defaultLocale,
  currency,
  maximumFractionDigits = 0,
  minimumFractionDigits
}: MoneyInput) {
  const resolvedLocale: SupportedLocale = normalizeLocale(locale);
  const resolvedCurrency = resolveCurrency(resolvedLocale, currency);
  return new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency: resolvedCurrency,
    maximumFractionDigits,
    minimumFractionDigits
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatCurrencyForLocale(value: number, locale?: string | null, currency?: string | null) {
  return formatMoney({ amount: value, locale, currency });
}

export function defaultCurrencyForLocale(locale?: string | null) {
  return currencyForLocale(locale ?? defaultLocale) ?? defaultCurrency;
}
