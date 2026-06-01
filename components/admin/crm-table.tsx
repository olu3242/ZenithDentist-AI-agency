import type { ReactNode } from "react";

export function CRMTable({
  columns,
  rows,
  empty = "No records yet."
}: {
  columns: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  return (
    <div className="overflow-hidden rounded border border-card bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column} className="border-b border-card px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-muted">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, index) => (
              <tr key={index} className="border-b border-card last:border-0">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-4 align-top text-sm">
                    {cell}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-10 text-center text-muted" colSpan={columns.length}>{empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
