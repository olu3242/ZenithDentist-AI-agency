import Link from "next/link";
import { ArrowRight, Play, Wand2 } from "lucide-react";
import { executeAutomationAction } from "@/app/automation-center/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import type { UniversalAction, WorkflowCatalogItem } from "@/lib/action-engine";

export function WorkflowLauncher({
  workflow,
  action,
  returnTo = "/dashboard",
  compact = false
}: {
  workflow: WorkflowCatalogItem;
  action?: UniversalAction;
  returnTo?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "flex flex-wrap gap-2" : "rounded border border-line bg-white p-4 shadow-sm"}>
      {compact ? null : (
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-wider text-teal">{workflow.category}</p>
          <h3 className="mt-1 text-lg font-black text-ink">{workflow.name}</h3>
          <p className="mt-1 text-sm font-semibold text-muted">{action?.expectedOutcome ?? workflow.expectedOutcome}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Link href={action?.href ?? "/automation-center"} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-line bg-white px-4 text-sm font-black text-ink hover:bg-paper">
          View
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/portal/alice" className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-line bg-white px-4 text-sm font-black text-ink hover:bg-paper">
          Analyze
          <Wand2 className="h-4 w-4" />
        </Link>
        <form action={executeAutomationAction}>
          <input type="hidden" name="workflowId" value={workflow.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <SubmitButton className="min-h-10 px-4" pendingText="Launching...">
            <Play className="h-4 w-4" />
            Execute
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
