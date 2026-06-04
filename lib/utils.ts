import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatMoney } from "@/lib/currency";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, locale = "en-US", currency?: string) {
  return formatMoney({ amount: value || 0, locale, currency });
}

export function formatPercent(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}
