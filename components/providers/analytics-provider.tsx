"use client";

import { useEffect } from "react";
import { trackClientEvent } from "@/lib/analytics";

export function AnalyticsProvider() {
  useEffect(() => {
    const milestones = [25, 50, 75, 100];
    const fired = new Set<number>();

    function onScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const depth = Math.round((window.scrollY / scrollable) * 100);
      const milestone = milestones.find(item => depth >= item && !fired.has(item));
      if (milestone) {
        fired.add(milestone);
        trackClientEvent("scroll_depth", { depth: milestone });
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
