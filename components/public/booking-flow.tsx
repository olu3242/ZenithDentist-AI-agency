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
  return (
    <Button
      asChild
      size="lg"
      onClick={() => {
        trackClientEvent("booking_clicked", { leadId });
        trackBookingClickAction({ leadId, source: "audit_preview" }).catch(() => undefined);
      }}
    >
      <a href={calendlyUrl} target="_blank" rel="noreferrer">
        <CalendarCheck className="h-4 w-4" />
        Book Recovery Audit
      </a>
    </Button>
  );
}
