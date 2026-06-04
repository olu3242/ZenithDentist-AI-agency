export const COOKIE_CONSENT_COOKIE = "cookie_consent";
export const COOKIE_CONSENT_EVENT = "zenith-cookie-consent-updated";

export type CookieConsentPreferences = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
};

export const defaultCookieConsent: CookieConsentPreferences = {
  essential: true,
  analytics: false,
  marketing: false
};

export function parseCookieConsent(value: string | undefined): CookieConsentPreferences | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<CookieConsentPreferences>;
    return {
      essential: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing)
    };
  } catch {
    return null;
  }
}

export function readCookieConsent(): CookieConsentPreferences | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find(item => item.startsWith(`${COOKIE_CONSENT_COOKIE}=`));

  return parseCookieConsent(cookie?.split("=").slice(1).join("="));
}

export function writeCookieConsent(preferences: CookieConsentPreferences) {
  if (typeof document === "undefined") return;

  const value = encodeURIComponent(JSON.stringify({ ...preferences, essential: true }));
  document.cookie = `${COOKIE_CONSENT_COOKIE}=${value}; Max-Age=15552000; Path=/; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent<CookieConsentPreferences>(COOKIE_CONSENT_EVENT, { detail: preferences }));
}

export function hasCookieConsent(category: "analytics" | "marketing") {
  return Boolean(readCookieConsent()?.[category]);
}
