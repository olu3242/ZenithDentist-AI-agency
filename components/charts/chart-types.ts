export type ChartDatum = {
  name: string;
  value?: number;
  secondary?: number;
  tertiary?: number;
  fill?: string;
};

export const chartPalette = {
  teal: "#14b8a6",
  gold: "#d8a441",
  ink: "#0f172a",
  rust: "#c2410c",
  blue: "#2563eb",
  violet: "#7c3aed",
  emerald: "#059669",
  muted: "#94a3b8"
};

export const chartGrid = "rgba(148, 163, 184, 0.22)";

export function compactNumber(value: number) {
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function compactMoney(value: number) {
  return Intl.NumberFormat("en-US", { notation: "compact", style: "currency", currency: "USD", maximumFractionDigits: 1 }).format(value);
}

export function tooltipMoney(value: unknown) {
  return compactMoney(Number(value ?? 0));
}
