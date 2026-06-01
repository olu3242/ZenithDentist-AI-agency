import type { PredictiveOperationalAlert } from "@/lib/runtime/predictive-monitoring";

export function ALICECopilot({ insights, alerts }: { insights: Array<{ title: string; detail: string; severity: string }>; alerts: PredictiveOperationalAlert[] }) {
  return (
    <aside className="rounded border border-card bg-surface p-5 text-white shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-accent">ALICE operational analyst</p>
      <h2 className="mt-1 text-2xl font-black">Runtime reasoning center</h2>
      <div className="mt-5 grid gap-3">
        {[...insights.map(item => ({ title: item.title, detail: item.detail })), ...alerts.map(item => ({ title: item.title, detail: item.detail }))].slice(0, 7).map(item => (
          <div key={`${item.title}-${item.detail}`} className="rounded border border-white/10 bg-white/8 p-4">
            <strong className="text-sm font-black text-white">{item.title}</strong>
            <p className="mt-2 text-sm font-semibold text-white/65">{item.detail}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
