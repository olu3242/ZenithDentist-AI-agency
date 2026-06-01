"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type SortDirection = "asc" | "desc";

type RowData = {
  cells: ReactNode[];
  search: string;
  sortValues: string[];
};

function toSearchText(value: ReactNode): string {
  if (value === null || value === undefined || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(toSearchText).join(" ");
  if (typeof value === "object" && "props" in value) {
    const props = value.props as { children?: ReactNode; title?: string; "aria-label"?: string };
    return [props.title, props["aria-label"], toSearchText(props.children)].filter(Boolean).join(" ");
  }
  return "";
}

export function CRMTable({
  columns,
  rows,
  empty = "No records yet."
}: {
  columns: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  const [query, setQuery] = useState("");
  const [columnFilter, setColumnFilter] = useState("all");
  const [sortIndex, setSortIndex] = useState(0);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const normalizedRows = useMemo<RowData[]>(() => rows.map(cells => {
    const sortValues = columns.map((_, index) => toSearchText(cells[index]).toLowerCase());
    return {
      cells,
      search: sortValues.join(" "),
      sortValues
    };
  }), [columns, rows]);

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = normalizedRows.filter(row => {
      if (!needle) return true;
      if (columnFilter === "all") return row.search.includes(needle);
      const index = Number(columnFilter);
      return row.sortValues[index]?.includes(needle);
    });
    return filtered.sort((a, b) => {
      const left = a.sortValues[sortIndex] ?? "";
      const right = b.sortValues[sortIndex] ?? "";
      const comparison = left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [columnFilter, normalizedRows, query, sortDirection, sortIndex]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(index: number) {
    setPage(1);
    if (sortIndex === index) {
      setSortDirection(direction => direction === "asc" ? "desc" : "asc");
    } else {
      setSortIndex(index);
      setSortDirection("asc");
    }
  }

  return (
    <div className="overflow-hidden rounded border border-line bg-white shadow-sm">
      <div className="grid gap-3 border-b border-line p-3 lg:grid-cols-[minmax(220px,1fr)_220px_140px_auto] lg:items-center">
        <label className="relative block">
          <span className="sr-only">Search table</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={event => {
              setQuery(event.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded border border-line bg-white pl-9 pr-3 text-sm font-semibold outline-none focus:border-teal"
            placeholder="Search records"
          />
        </label>
        <label>
          <span className="sr-only">Filter column</span>
          <select
            value={columnFilter}
            onChange={event => {
              setColumnFilter(event.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded border border-line bg-white px-3 text-sm font-bold text-ink"
          >
            <option value="all">All columns</option>
            {columns.map((column, index) => (
              <option key={column} value={String(index)}>{column}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Rows per page</span>
          <select
            value={pageSize}
            onChange={event => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="h-10 w-full rounded border border-line bg-white px-3 text-sm font-bold text-ink"
          >
            {[10, 25, 50].map(size => <option key={size} value={size}>{size} rows</option>)}
          </select>
        </label>
        <p className="text-xs font-black uppercase tracking-wider text-muted">
          {filteredRows.length} / {rows.length} records
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={column} className="border-b border-line px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-muted">
                  <button
                    type="button"
                    onClick={() => toggleSort(index)}
                    className="inline-flex items-center gap-2 rounded text-left hover:text-ink"
                    aria-label={`Sort by ${column}`}
                  >
                    {column}
                    <ChevronsUpDown className={`h-3.5 w-3.5 ${sortIndex === index ? "text-teal" : "text-muted"}`} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length ? pageRows.map((row, index) => (
              <tr key={`${currentPage}-${index}`} className="border-b border-line last:border-0">
                {row.cells.map((cell, cellIndex) => (
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

      <div className="flex flex-col gap-3 border-t border-line p-3 text-sm font-bold text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>Page {currentPage} of {totalPages}</span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" disabled={currentPage <= 1} onClick={() => setPage(value => Math.max(1, value - 1))}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button type="button" variant="secondary" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(value => Math.min(totalPages, value + 1))}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
