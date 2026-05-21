import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  detail,
  tone = "teal"
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: "teal" | "rust" | "gold" | "green" | "blue";
}) {
  const toneClass = {
    teal: "text-teal",
    rust: "text-rust",
    gold: "text-gold",
    green: "text-green",
    blue: "text-blue"
  }[tone];

  return (
    <article className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      <strong className={cn("mt-3 block text-3xl font-black", toneClass)}>{value}</strong>
      <span className="mt-2 block text-sm font-semibold text-muted">{detail}</span>
    </article>
  );
}
