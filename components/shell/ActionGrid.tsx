"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ActionCard } from "./types";

const toneStyles: Record<string, string> = {
  primary: "border-blue-200 hover:border-blue-400",
  success: "border-green-200 hover:border-green-400",
  warning: "border-amber-200 hover:border-amber-400",
  danger: "border-red-200 hover:border-red-400",
};

const iconTone: Record<string, string> = {
  primary: "text-blue-600 bg-blue-50",
  success: "text-green-600 bg-green-50",
  warning: "text-amber-600 bg-amber-50",
  danger: "text-red-600 bg-red-50",
};

const colsMap: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

function ActionCardItem({ action }: { action: ActionCard }) {
  const Icon = action.icon;
  const tone = action.tone ?? "primary";
  const borderStyle = toneStyles[tone] ?? toneStyles.primary;
  const iconStyle = iconTone[tone] ?? iconTone.primary;

  const inner = (
    <article
      className={cn(
        "rounded border bg-white p-5 shadow-sm flex flex-col gap-3 h-full transition-colors cursor-pointer",
        borderStyle
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {Icon && (
          <div className={cn("rounded p-2 shrink-0", iconStyle)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        {action.badge && (
          <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-muted">
            {action.badge}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-foreground text-sm">{action.title}</h3>
        <p className="text-xs text-muted leading-relaxed">{action.description}</p>
      </div>
    </article>
  );

  if (action.href) {
    return <Link href={action.href} className="h-full">{inner}</Link>;
  }

  if (action.onClick) {
    return <button onClick={action.onClick} className="h-full text-left w-full">{inner}</button>;
  }

  return inner;
}

export function ActionGrid({
  actions,
  cols = 3,
}: {
  actions: ActionCard[];
  cols?: 2 | 3 | 4;
}) {
  return (
    <div className={cn("grid gap-5", colsMap[cols])}>
      {actions.map((action, i) => (
        <ActionCardItem key={i} action={action} />
      ))}
    </div>
  );
}
