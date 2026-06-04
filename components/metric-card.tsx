import { cn } from "@/lib/utils";

type MetricTone = "primary" | "secondary" | "accent" | "success" | "warning" | "danger" | "teal" | "rust" | "gold" | "green" | "blue";

export function MetricCard({
  label,
  value,
  detail,
  tone = "primary"
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: MetricTone;
}) {
  const toneClass: Record<string, string> = {
    primary:   "text-primary",
    secondary: "text-secondary",
    accent:    "text-accent",
    success:   "text-success",
    warning:   "text-warning",
    danger:    "text-danger",
    // legacy aliases
    teal:  "text-accent",
    rust:  "text-danger",
    gold:  "text-warning",
    green: "text-success",
    blue:  "text-primary",
  };

  return (
    <article className="min-h-40 rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      <strong className={cn("mt-3 block text-3xl font-black", toneClass[tone] ?? "text-primary")}>{value}</strong>
      <span className="mt-2 block text-sm font-semibold text-muted">{detail}</span>
    </article>
  );
}
