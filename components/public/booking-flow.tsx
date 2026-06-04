"use client";

import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackClientEvent } from "@/lib/analytics";
import { trackBookingClickAction } from "@/app/actions";

export function BookingFlow({
  calendlyUrl,
  leadId,
  assessmentId
}: {
  calendlyUrl: string;
  leadId?: string;
  assessmentId?: string;
}) {
  // utm_content = leadId so webhook can link booking to lead
  // utm_campaign = assessmentId so webhook can link booking to assessment
  function buildHref() {
    if (!calendlyUrl) return "#";
    const params = new URLSearchParams({
      utm_source: "zenith_assessment",
      utm_medium: "report_cta"
    });
    if (leadId) params.set("utm_content", leadId);
    if (assessmentId) params.set("utm_campaign", assessmentId);
    return `${calendlyUrl}${calendlyUrl.includes("?") ? "&" : "?"}${params.toString()}`;
  }

  return (
    <Button
      asChild
      size="lg"
      onClick={() => {
        trackClientEvent("booking_clicked", { leadId, assessmentId });
        trackBookingClickAction({ leadId, source: "audit_preview" }).catch(() => undefined);
      }}
    >
      <a href={buildHref()} target="_blank" rel="noreferrer">
        <CalendarCheck className="h-4 w-4" />
        Schedule Strategy Session
      </a>
    </Button>
  );
}
