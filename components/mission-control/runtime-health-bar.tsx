import { Activity, AlertTriangle, Gauge, RotateCcw, ServerCog, Zap } from "lucide-react";
import type { RuntimeHealthState } from "@/lib/runtime/automation-health";
import type { ProviderHealth } from "@/lib/runtime/provider-health";
import type { ReplayCenterState } from "@/lib/runtime/replay-engine";

export function RuntimeHealthBar({ state, providers, replay }: { state: RuntimeHealthState; providers: ProviderHealth[]; replay: ReplayCenterState }) {
  const providerHealth = providers.length ? Math.round(providers.reduce((sum, provider) => sum + provider.uptimeScore, 0) / providers.length) : 0;
  const latencyValues = state.traces.filter(trace => trace.latency_ms !== null).map(trace => trace.latency_ms ?? 0);
  const avgLatency = latencyValues.length ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length) : 0;
  const items = [
    { label: "Health", value: `${state.scores.operationalScore}%`, icon: Gauge, tone: "text-accent" },
    { label: "SLA", value: `${state.traces.length ? Math.round(((state.traces.length - state.slaBreaches.length) / state.traces.length) * 100) : 0}%`, icon: Activity, tone: "text-success" },
    { label: "Incidents", value: String(state.unhealthyWorkflows.length), icon: AlertTriangle, tone: "text-danger" },
    { label: "Latency", value: `${avgLatency}ms`, icon: Zap, tone: "text-warning" },
    { label: "Providers", value: `${providerHealth}%`, icon: ServerCog, tone: "text-primary" },
    { label: "Replay", value: String(replay.candidates.length), icon: RotateCcw, tone: "text-accent" }
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      {items.map(item => (
        <div key={item.label} className="rounded border border-card bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <item.icon className={item.tone} size={18} />
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
          </div>
          <p className="mt-3 text-xs font-black uppercase tracking-wider text-muted">{item.label}</p>
          <strong className="mt-1 block text-2xl font-black text-[#F8FAFC]">{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
