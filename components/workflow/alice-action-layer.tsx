import { Check, Edit3, Play, X } from "lucide-react";
import { executeAutomationAction } from "@/app/automation-center/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import type { WorkflowCatalogItem } from "@/lib/action-engine";

export function AliceActionLayer({
  recommendation,
  workflow,
  returnTo = "/dashboard"
}: {
  recommendation: string;
  workflow: WorkflowCatalogItem;
  returnTo?: string;
}) {
  return (
    <div className="rounded border border-line bg-paper p-4">
      <p className="text-sm font-semibold text-muted">{recommendation}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="inline-flex min-h-9 items-center gap-2 rounded border border-line bg-white px-3 text-xs font-black text-ink" type="button">
          <Check className="h-3.5 w-3.5 text-green" />
          Approve
        </button>
        <button className="inline-flex min-h-9 items-center gap-2 rounded border border-line bg-white px-3 text-xs font-black text-ink" type="button">
          <Edit3 className="h-3.5 w-3.5 text-blue" />
          Modify
        </button>
        <button className="inline-flex min-h-9 items-center gap-2 rounded border border-line bg-white px-3 text-xs font-black text-ink" type="button">
          <X className="h-3.5 w-3.5 text-rust" />
          Reject
        </button>
        <form action={executeAutomationAction}>
          <input type="hidden" name="workflowId" value={workflow.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <SubmitButton className="min-h-9 px-3 text-xs" pendingText="Executing...">
            <Play className="h-3.5 w-3.5" />
            Execute
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
