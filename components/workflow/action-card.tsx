import Link from "next/link";
import { ArrowRight, Brain, Search, Target } from "lucide-react";
import { WorkflowLauncher } from "@/components/workflow/workflow-launcher";
import type { UniversalAction, WorkflowCatalogItem } from "@/lib/action-engine";

export function ActionCard({
  title,
  value,
  detail,
  workflow,
  actions,
  returnTo = "/dashboard"
}: {
  title: string;
  value: string | number;
  detail: string;
  workflow: WorkflowCatalogItem;
  actions: UniversalAction[];
  returnTo?: string;
}) {
  const view = actions.find(action => action.stage === "view");
  const analyze = actions.find(action => action.stage === "analyze");
  const recommend = actions.find(action => action.stage === "recommend");
  const execute = actions.find(action => action.stage === "execute");

  return (
    <article className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">{title}</p>
      <strong className="mt-3 block text-3xl font-black text-teal">{value}</strong>
      <p className="mt-2 text-sm font-semibold text-muted">{detail}</p>
      <div className="mt-4 grid gap-2 text-sm">
        {view ? <ActionLink icon={ArrowRight} label={view.title} href={view.href} /> : null}
        {analyze ? <ActionLink icon={Search} label={analyze.title} href={analyze.href} /> : null}
        {recommend ? <ActionLink icon={Brain} label={recommend.title} href={recommend.href} /> : null}
      </div>
      {execute ? (
        <div className="mt-4">
          <WorkflowLauncher workflow={workflow} action={execute} returnTo={returnTo} compact />
        </div>
      ) : null}
    </article>
  );
}

function ActionLink({ icon: Icon, label, href }: { icon: typeof Target; label: string; href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded border border-line bg-paper px-3 py-2 font-bold text-ink hover:border-teal/60 hover:bg-white">
      <Icon className="h-4 w-4 text-teal" />
      {label}
    </Link>
  );
}
