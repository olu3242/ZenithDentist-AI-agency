import type { LeadStatus } from "@/lib/database.types";
import { cn } from "@/lib/utils";

const tone: Record<LeadStatus, string> = {
  new: "bg-blue/10 text-blue",
  roi_completed: "bg-gold/10 text-gold",
  audit_requested: "bg-teal/10 text-teal",
  booked: "bg-green/10 text-green",
  qualified: "bg-ink/10 text-ink",
  won: "bg-green/10 text-green",
  lost: "bg-rust/10 text-rust"
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={cn("inline-flex min-h-7 items-center rounded-full px-3 text-xs font-black capitalize", tone[status])}>
      {status.replace("_", " ")}
    </span>
  );
}
