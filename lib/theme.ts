/**
 * Zenith AI — Design Token System
 *
 * Maps BRAND values to Tailwind utility class tokens.
 * Use these constants instead of raw color strings everywhere.
 */

import { BRAND } from "./brand";

export const THEME = {
  // ── Layout ────────────────────────────────────────────────────────────────
  layout: {
    sidebarWidth: "270px",
    headerHeight: "64px",
    maxContentWidth: "1280px",
  },

  // ── Color tokens → Tailwind class fragments ───────────────────────────────
  page:    "bg-[#0F172A] text-[#F8FAFC]",
  surface: "bg-[#111827]",
  card:    "bg-[#1E293B] border border-[#1E293B]",
  border:  "border-[#1E293B]",

  // ── Sidebar ───────────────────────────────────────────────────────────────
  sidebar: {
    bg:       "bg-[#111827]",
    border:   "border-r border-[#1E293B]",
    text:     "text-[#94A3B8]",
    hover:    "hover:bg-[#1E293B] hover:text-[#F8FAFC]",
    active:   "bg-[#1E293B] text-[#F8FAFC]",
    logoBg:   "bg-[#2563EB]",
  },

  // ── Navigation ────────────────────────────────────────────────────────────
  nav: {
    item:     "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#94A3B8] transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC]",
    active:   "bg-[#1E293B] text-[#F8FAFC]",
  },

  // ── Brand logo mark ───────────────────────────────────────────────────────
  logoMark: "grid h-9 w-9 place-items-center rounded-md bg-[#2563EB] font-black text-white text-sm",

  // ── Buttons ───────────────────────────────────────────────────────────────
  btn: {
    primary:   "bg-[#2563EB] text-white hover:bg-[#1D4ED8]",
    secondary: "bg-[#06B6D4] text-white hover:bg-[#0891B2]",
    ghost:     "bg-transparent text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC]",
    danger:    "bg-[#EF4444] text-white hover:bg-[#DC2626]",
  },

  // ── Status badges ─────────────────────────────────────────────────────────
  badge: {
    success: "bg-[#22C55E]/10 text-[#22C55E]",
    warning: "bg-[#F59E0B]/10 text-[#F59E0B]",
    danger:  "bg-[#EF4444]/10 text-[#EF4444]",
    muted:   "bg-[#94A3B8]/10 text-[#94A3B8]",
    primary: "bg-[#2563EB]/10 text-[#2563EB]",
  },

  // ── Typography ────────────────────────────────────────────────────────────
  text: {
    heading: "font-bold text-[#F8FAFC]",
    body:    "text-[#F8FAFC]",
    muted:   "text-[#94A3B8]",
    primary: "text-[#2563EB]",
    accent:  "text-[#14B8A6]",
  },

  // ── Loading ───────────────────────────────────────────────────────────────
  skeleton: "animate-pulse rounded-md bg-[#1E293B]",

  // ── Focus ring ────────────────────────────────────────────────────────────
  focusRing: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]",
} as const;

export { BRAND };
