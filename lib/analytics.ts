export type AnalyticsEvent =
  | "roi_started"
  | "roi_completed"
  | "audit_requested"
  | "booking_clicked"
  | "booking_completed"
  | "faq_interaction"
  | "cta_clicked"
  | "scroll_depth"
  | "lead_submitted"
  | "automation_success_rate"
  | "recall_conversion"
  | "review_conversion"
  | "patient_engagement"
  | "dashboard_usage"
  | "report_download";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    lintrk?: (...args: unknown[]) => void;
  }
}

export function trackClientEvent(event: AnalyticsEvent, metadata: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  if (!document.cookie.includes("cookie_consent=")) return;

  const consentCookie = document.cookie
    .split("; ")
    .find(item => item.startsWith("cookie_consent="))
    ?.split("=")
    .slice(1)
    .join("=");

  try {
    const consent = consentCookie ? JSON.parse(decodeURIComponent(consentCookie)) as { analytics?: boolean; marketing?: boolean } : null;
    if (!consent?.analytics) return;
  } catch {
    return;
  }

  window.gtag?.("event", event, metadata);
  window.fbq?.("trackCustom", event, metadata);
  window.lintrk?.("track", { conversion_id: event, ...metadata });
}
