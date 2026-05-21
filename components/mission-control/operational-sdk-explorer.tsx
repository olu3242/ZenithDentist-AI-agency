import type { ProductizationState } from "@/lib/platform/productization";

export function OperationalSDKExplorer({ state }: { state: ProductizationState }) {
  return (
    <section className="rounded border border-[#273244] bg-[#161a22] p-5 text-[#f5f2ed] shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-[#1a7a6e]">Zenith Operational SDK</p>
      <h2 className="mt-1 text-2xl font-black">Developer cloud surfaces</h2>
      <div className="mt-5 grid gap-3">
        {state.sdkSurfaces.map(surface => (
          <div key={surface.key} className="rounded border border-white/10 bg-[#1d2330] p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black">{surface.name}</strong>
              <span className="text-xs font-black text-[#10b981]">{surface.readiness}%</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#94a3b8]">{surface.endpoint}</p>
            <p className="mt-2 text-xs font-bold text-[#94a3b8]">{surface.scopes.join(", ")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
