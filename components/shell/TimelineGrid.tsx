import { cn } from "@/lib/utils";
import type { TimelineItem } from "./types";

const dotColors: Record<string, string> = {
  primary: "bg-blue-600",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  accent: "bg-teal-500",
};

const iconColors: Record<string, string> = {
  primary: "text-blue-600",
  success: "text-green-500",
  warning: "text-amber-500",
  danger: "text-red-500",
  accent: "text-teal-500",
};

export function TimelineGrid({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative flex flex-col gap-0">
      {items.map((item, i) => {
        const Icon = item.icon;
        const tone = item.tone ?? "primary";
        const isLast = i === items.length - 1;

        return (
          <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[11px] top-6 bottom-0 w-px bg-line" />
            )}

            {/* Dot / Icon */}
            <div className="relative mt-0.5 shrink-0">
              {Icon ? (
                <div className={cn("flex h-6 w-6 items-center justify-center rounded-full bg-white border border-line shadow-sm", iconColors[tone])}>
                  <Icon className="h-3 w-3" />
                </div>
              ) : (
                <div className={cn("h-6 w-6 rounded-full border-2 border-white shadow-sm ring-2 ring-line", dotColors[tone])} />
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-bold text-foreground">{item.title}</span>
                <span className="shrink-0 text-xs text-muted">{item.timestamp}</span>
              </div>
              {item.description && (
                <p className="text-xs text-muted leading-relaxed">{item.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
