import type { RuntimeHealthState } from "@/lib/runtime/automation-health";
import type { ReplayCenterState } from "@/lib/runtime/replay-engine";
import type { TenantIntelligenceState } from "@/lib/runtime/tenant-intelligence";

export function ExecutiveKPIGrid({ runtime, replay, tenant }: { runtime: RuntimeHealthState; replay: ReplayCenterState; tenant: TenantIntelligenceState }) {
  const items = [
    { label: "Runtime uptime", value: `${runtime.scores.reliabilityScore}%`, detail: "Execution reliability" },
    { label: "Replay success posture", value: `${replay.averageConfidence}%`, detail: `${replay.candidates.length} candidates` },
    { label: "Operational maturity", value: `${tenant.operationalMaturity}%`, detail: tenant.organizationName },
    { label: "SLA confidence", value: `${tenant.slaConfidence}%`, detail: "Tenant timing posture" },
    { label: "Provider stability", value: `${tenant.providerDependencyScore}%`, detail: "Dependency confidence" },
    { label: "Operational risk", value: `${tenant.operationalRisk}%`, detail: "Lower is better" }
  ];
  return (
    <section className="rounded border border-[#273244] bg-[#161a22] p-5 text-[#f5f2ed] shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-[#1a7a6e]">Executive Operations Center</p>
      <h2 className="mt-1 text-2xl font-black">Operational trust indicators</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {items.map(item => (
          <div key={item.label} className="rounded border border-white/10 bg-[#1d2330] p-4">
            <p className="text-xs font-black uppercase tracking-wider text-[#94a3b8]">{item.label}</p>
            <strong className="mt-2 block text-3xl font-black">{item.value}</strong>
            <p className="mt-1 text-sm font-semibold text-[#94a3b8]">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
