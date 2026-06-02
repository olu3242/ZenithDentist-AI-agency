"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { InsightCard } from "./types";

const toneColors: Record<string, { bar: string; badge: string }> = {
  primary: { bar: "bg-blue-600", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  success: { bar: "bg-green-500", badge: "bg-green-50 text-green-700 border-green-200" },
  warning: { bar: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  danger: { bar: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200" },
};

const colsMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
};

function InsightCardItem({ insight }: { insight: InsightCard }) {
  const tone = insight.tone ?? "primary";
  const colors = toneColors[tone] ?? toneColors.primary;
  const pct = Math.round(insight.confidence * 100);

  return (
    <article className="rounded border border-line bg-white p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-foreground text-sm leading-snug">{insight.title}</h3>
        <span className={cn("shrink-0 rounded border px-2 py-0.5 text-xs font-semibold", colors.badge)}>
          {pct}% confidence
        </span>
      </div>

      <p className="text-sm text-muted leading-relaxed">{insight.summary}</p>

      {/* Confidence bar */}
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", colors.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2 mt-1">
        {insight.traceId && (
          <span className="text-xs text-muted font-mono opacity-60">{insight.traceId}</span>
        )}
        {insight.action && (
          <div className="ml-auto">
            {insight.action.href ? (
              <Link
                href={insight.action.href}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline"
              >
                {insight.action.label}
              </Link>
            ) : (
              <button
                onClick={insight.action.onClick}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline"
              >
                {insight.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function InsightGrid({
  insights,
  cols = 2,
}: {
  insights: InsightCard[];
  cols?: 1 | 2 | 3;
}) {
  return (
    <div className={cn("grid gap-5", colsMap[cols])}>
      {insights.map((insight, i) => (
        <InsightCardItem key={i} insight={insight} />
      ))}
    </div>
  );
}
