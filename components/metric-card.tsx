import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  detail,
  tone = "primary"
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: "primary" | "secondary" | "accent" | "success" | "warning" | "danger";
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
    <article className="zenith-card">
      <p className="text-xs font-black uppercase tracking-wider text-[#94A3B8]">{label}</p>
      <strong className={cn("mt-3 block text-3xl font-black", toneClass[tone] ?? "text-primary")}>
        {value}
      </strong>
      <span className="mt-2 block text-sm font-semibold text-[#94A3B8]">{detail}</span>
    </article>
  );
}
