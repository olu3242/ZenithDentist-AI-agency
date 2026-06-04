"use client";

import { useEffect } from "react";
import { trackClientEvent } from "@/lib/analytics";
import { COOKIE_CONSENT_EVENT, hasCookieConsent } from "@/lib/cookie-consent";

export function AnalyticsProvider() {
  useEffect(() => {
    let analyticsAllowed = hasCookieConsent("analytics");
    const milestones = [25, 50, 75, 100];
    const fired = new Set<number>();

    function onScroll() {
      if (!analyticsAllowed) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const depth = Math.round((window.scrollY / scrollable) * 100);
      const milestone = milestones.find(item => depth >= item && !fired.has(item));
      if (milestone) {
        fired.add(milestone);
        trackClientEvent("scroll_depth", { depth: milestone });
      }
    }

    function onConsentUpdated() {
      analyticsAllowed = hasCookieConsent("analytics");
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsentUpdated);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener(COOKIE_CONSENT_EVENT, onConsentUpdated);
    };
  }, []);

  return null;
}
