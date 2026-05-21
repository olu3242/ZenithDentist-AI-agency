"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackClientEvent } from "@/lib/analytics";

export function PortalUsageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackClientEvent("cta_clicked", { area: "portal_usage", pathname });
  }, [pathname]);

  return null;
}
