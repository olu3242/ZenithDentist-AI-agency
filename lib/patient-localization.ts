import { defaultLocale, normalizeLocale, type SupportedLocale } from "@/lib/i18n/config";

export type PatientLanguageContext = {
  preferred_language?: string | null;
  organization_locale?: string | null;
  profile_locale?: string | null;
};

export function resolvePatientLocale(context: PatientLanguageContext = {}): SupportedLocale {
  return normalizeLocale(
    context.preferred_language ??
    context.profile_locale ??
    context.organization_locale ??
    defaultLocale
  );
}
