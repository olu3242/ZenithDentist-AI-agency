import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isSupportedLocale } from "@/lib/i18n/config";
import { getRequestLocale, getRequestMessages } from "@/lib/i18n/messages";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isSupportedLocale(requested) ? requested : await getRequestLocale();

  return {
    locale,
    messages: await getRequestMessages(locale),
    timeZone: locale === "fr-CA" || locale === "en-CA" ? "America/Toronto" : "America/Chicago",
    now: new Date()
  };
});
