"use client";

import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackClientEvent } from "@/lib/analytics";
import { trackBookingClickAction } from "@/app/actions";

export function BookingFlow({
  calendlyUrl,
  leadId
}: {
  calendlyUrl: string;
  leadId?: string;
}) {
  // Inject leadId as utm_content so the Calendly webhook can link the booking back to this lead
  const href = leadId && calendlyUrl
    ? `${calendlyUrl}${calendlyUrl.includes("?") ? "&" : "?"}utm_content=${encodeURIComponent(leadId)}&utm_source=zenith_assessment&utm_medium=report_cta`
    : calendlyUrl;

  return (
    <Button
      asChild
      size="lg"
      onClick={() => {
        trackClientEvent("booking_clicked", { leadId });
        trackBookingClickAction({ leadId, source: "audit_preview" }).catch(() => undefined);
      }}
    >
      <a href={href} target="_blank" rel="noreferrer">
        <CalendarCheck className="h-4 w-4" />
        Schedule Strategy Session
      </a>
    </Button>
  );
}
