import { Activity, AlertTriangle, Gauge, RotateCcw, ServerCog, Zap } from "lucide-react";
import type { RuntimeHealthState } from "@/lib/runtime/automation-health";
import type { ProviderHealth } from "@/lib/runtime/provider-health";
import type { ReplayCenterState } from "@/lib/runtime/replay-engine";

export function RuntimeHealthBar({ state, providers, replay }: { state: RuntimeHealthState; providers: ProviderHealth[]; replay: ReplayCenterState }) {
  const providerHealth = providers.length ? Math.round(providers.reduce((sum, provider) => sum + provider.uptimeScore, 0) / providers.length) : 0;
  const latencyValues = state.traces.filter(trace => trace.latency_ms !== null).map(trace => trace.latency_ms ?? 0);
  const avgLatency = latencyValues.length ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length) : 0;
  const items = [
    { label: "Health", value: `${state.scores.operationalScore}%`, icon: Gauge, tone: "text-teal" },
    { label: "SLA", value: `${state.traces.length ? Math.round(((state.traces.length - state.slaBreaches.length) / state.traces.length) * 100) : 0}%`, icon: Activity, tone: "text-green" },
    { label: "Incidents", value: String(state.unhealthyWorkflows.length), icon: AlertTriangle, tone: "text-rust" },
    { label: "Latency", value: `${avgLatency}ms`, icon: Zap, tone: "text-gold" },
    { label: "Providers", value: `${providerHealth}%`, icon: ServerCog, tone: "text-blue" },
    { label: "Replay", value: String(replay.candidates.length), icon: RotateCcw, tone: "text-teal" }
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      {items.map(item => (
        <div key={item.label} className="rounded border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <item.icon className={item.tone} size={18} />
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-teal" />
            </span>
          </div>
          <p className="mt-3 text-xs font-black uppercase tracking-wider text-muted">{item.label}</p>
          <strong className="mt-1 block text-2xl font-black text-ink">{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
