"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export function ExecutiveKPI({ label, value, detail, trend, icon: Icon }: { label: string; value: string | number; detail: string; trend?: string; icon?: LucideIcon }) {
  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded border border-line bg-white p-4 shadow-sm dark:border-white/20 dark:bg-white/10 dark:text-white">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wider text-muted dark:text-white/60">{label}</p>
        {Icon ? <Icon className="h-5 w-5 text-teal" /> : null}
      </div>
      <strong className="mt-3 block text-3xl font-black text-ink dark:text-white">{value}</strong>
      <p className="mt-1 text-xs font-bold text-muted dark:text-white/65">{detail}</p>
      {trend ? <p className="mt-3 text-xs font-black text-teal">{trend}</p> : null}
    </motion.article>
  );
}
