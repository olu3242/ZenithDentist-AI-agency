import type { LeadStatus } from "@/lib/database.types";
import { cn } from "@/lib/utils";

const tone: Record<LeadStatus, string> = {
  new: "bg-primary/10 text-primary",
  roi_completed: "bg-warning/10 text-warning",
  audit_requested: "bg-accent/10 text-accent",
  booked: "bg-success/10 text-success",
  qualified: "bg-surface/10 text-[#F8FAFC]",
  won: "bg-success/10 text-success",
  lost: "bg-danger/10 text-danger"
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={cn("inline-flex min-h-7 items-center rounded-full px-3 text-xs font-black capitalize", tone[status])}>
      {status.replace("_", " ")}
    </span>
  );
}
