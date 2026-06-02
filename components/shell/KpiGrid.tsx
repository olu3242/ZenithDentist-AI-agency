import { cn } from "@/lib/utils";
import type { KpiItem } from "./types";

const toneClass: Record<string, string> = {
  primary: "text-blue-600",
  secondary: "text-cyan-500",
  accent: "text-teal-500",
  success: "text-green-500",
  warning: "text-amber-500",
  danger: "text-red-500",
};

const colsMap: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

function KpiCard({ item }: { item: KpiItem }) {
  const Icon = item.icon;
  const tone = item.tone ?? "primary";
  return (
    <article className="rounded border border-line bg-white p-5 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-wider text-muted">{item.label}</p>
        {Icon && <Icon className={cn("h-4 w-4", toneClass[tone])} />}
      </div>
      <strong className={cn("text-3xl font-black", toneClass[tone])}>
        {item.value}
      </strong>
      {item.change !== undefined && (
        <span className={cn("text-xs font-semibold", item.changePositive ? "text-green-500" : "text-red-500")}>
          {item.change}
        </span>
      )}
    </article>
  );
}

export function KpiGrid({
  items,
  cols = 4,
}: {
  items: KpiItem[];
  cols?: 2 | 3 | 4;
}) {
  return (
    <div className={cn("grid gap-5", colsMap[cols])}>
      {items.map((item, i) => (
        <KpiCard key={i} item={item} />
      ))}
    </div>
  );
}
