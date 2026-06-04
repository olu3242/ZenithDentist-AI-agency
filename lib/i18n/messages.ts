import "server-only";

import { cookies, headers } from "next/headers";
import { defaultLocale, isSupportedLocale, type SupportedLocale } from "@/lib/i18n/config";

export type Messages = typeof import("@/messages/en-US.json");

const loaders: Record<SupportedLocale, () => Promise<Messages>> = {
  "en-US": () => import("@/messages/en-US.json").then(module => module.default),
  "es-US": () => import("@/messages/es-US.json").then(module => module.default),
  "en-CA": () => import("@/messages/en-CA.json").then(module => module.default),
  "fr-CA": () => import("@/messages/fr-CA.json").then(module => module.default)
};

export async function getRequestLocale() {
  const headerLocale = (await headers()).get("x-zenith-locale");
  if (isSupportedLocale(headerLocale)) return headerLocale;

  const cookieLocale = (await cookies()).get("zenith_locale")?.value;
  if (isSupportedLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  if (acceptLanguage.toLowerCase().includes("fr-ca")) return "fr-CA";
  if (acceptLanguage.toLowerCase().includes("es")) return "es-US";
  if (acceptLanguage.toLowerCase().includes("en-ca")) return "en-CA";
  return defaultLocale;
}

export async function getRequestMessages(locale = defaultLocale) {
  const resolved = isSupportedLocale(locale) ? locale : defaultLocale;
  return loaders[resolved]();
}

export function getMessage(messages: Record<string, unknown>, path: string, fallback = path) {
  const value = path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, messages);
  return typeof value === "string" ? value : fallback;
}
