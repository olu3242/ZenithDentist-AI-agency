import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { InsightSnapshot } from "@/lib/data/operations";
import { cn } from "@/lib/utils";

export function InsightCard({ insight }: { insight: InsightSnapshot }) {
  const Icon = insight.severity === "critical" || insight.severity === "warning" ? AlertTriangle : insight.severity === "success" ? CheckCircle2 : Info;
  return (
    <article className={cn("rounded border bg-white p-5 shadow-sm", insight.severity === "critical" ? "border-rust/40" : "border-line")}>
      <div className="flex items-start gap-3">
        <span className="rounded bg-teal/10 p-2 text-teal"><Icon className="h-5 w-5" /></span>
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-muted">{insight.category} · {Math.round(Number(insight.confidence) * 100)}% confidence</p>
          <h3 className="mt-2 text-lg font-black">{insight.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{insight.summary}</p>
        </div>
      </div>
    </article>
  );
}
