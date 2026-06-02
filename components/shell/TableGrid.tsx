"use client";

import { cn } from "@/lib/utils";
import type { TableColumn } from "./types";

export function TableGrid<T extends Record<string, unknown>>({
  columns,
  rows,
  emptyMessage = "No data available",
  className,
}: {
  columns: TableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded border border-line bg-white shadow-sm", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-gray-50">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  "px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-muted",
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-sm text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-line last:border-0 hover:bg-gray-50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn("px-4 py-3 text-foreground", col.className)}
                  >
                    {col.render
                      ? col.render(row)
                      : String(row[col.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
