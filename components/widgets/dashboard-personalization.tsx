"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveGridLayout } from "react-grid-layout";
import { motion } from "framer-motion";
import { Plus, Save, SlidersHorizontal, X } from "lucide-react";

export type DashboardMode = "executive" | "operations" | "clinical" | "revenue";
export type DashboardTheme = "classic_enterprise" | "glass_executive" | "mission_control" | "dental_intelligence";

export function DashboardPersonalization({ widgets }: { widgets: Array<{ id: string; title: string; body: string }> }) {
  const [visible, setVisible] = useState(widgets.map(widget => widget.id));
  const [mode, setMode] = useState<DashboardMode>("executive");
  const [theme, setTheme] = useState<DashboardTheme>("glass_executive");
  const [width, setWidth] = useState(1180);
  useEffect(() => {
    const updateWidth = () => setWidth(Math.max(360, Math.min(1180, window.innerWidth - 72)));
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);
  const layouts = useMemo(() => ({
    lg: visible.map((id, index) => ({ i: id, x: (index % 3) * 4, y: Math.floor(index / 3) * 3, w: 4, h: 3, minW: 3, minH: 2 }))
  }), [visible]);
  const active = widgets.filter(widget => visible.includes(widget.id));

  return (
    <section className="rounded border border-white/20 bg-white/10 p-4 shadow-sm backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-muted">Smart Dashboard</p>
          <h2 className="text-xl font-black text-ink">Personalized Operating View</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={mode} onChange={event => setMode(event.target.value as DashboardMode)} className="rounded border border-line bg-white px-3 py-2 text-xs font-black">
            {["executive", "operations", "clinical", "revenue"].map(item => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={theme} onChange={event => setTheme(event.target.value as DashboardTheme)} className="rounded border border-line bg-white px-3 py-2 text-xs font-black">
            {["classic_enterprise", "glass_executive", "mission_control", "dental_intelligence"].map(item => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="inline-flex items-center gap-2 rounded bg-ink px-3 py-2 text-xs font-black text-white"><Save className="h-4 w-4" /> Save Layout</button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {widgets.map(widget => (
          <button key={widget.id} onClick={() => setVisible(current => current.includes(widget.id) ? current.filter(id => id !== widget.id) : [...current, widget.id])} className="inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-xs font-black text-muted">
            {visible.includes(widget.id) ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            {widget.title}
          </button>
        ))}
      </div>
      <ResponsiveGridLayout className="mt-4" width={width} layouts={layouts} breakpoints={{ lg: 1024, md: 768, sm: 0 }} cols={{ lg: 12, md: 8, sm: 4 }} rowHeight={64}>
        {active.map(widget => (
          <motion.article key={widget.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded border border-white/20 bg-white/10 p-4 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-teal" />
              <h3 className="font-black text-ink">{widget.title}</h3>
            </div>
            <p className="mt-2 text-sm font-bold text-muted">{widget.body}</p>
          </motion.article>
        ))}
      </ResponsiveGridLayout>
    </section>
  );
}
