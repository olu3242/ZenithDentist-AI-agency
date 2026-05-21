import type { EnterpriseCloudState } from "@/lib/enterprise-cloud";
import { Fragment } from "react";

export function OrganizationalHeatmap({ state }: { state: EnterpriseCloudState }) {
  const locations = ["Austin Flagship", "Round Rock", "Cedar Park"];
  const metrics = ["Revenue recovery", "Retention", "Provider load", "No-show risk"];
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Multi-location intelligence</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Organizational heatmap</h2>
      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[620px]">
          <div className="grid grid-cols-[160px_repeat(4,1fr)] gap-2">
            <div />
            {metrics.map(metric => <div key={metric} className="text-xs font-black uppercase text-muted">{metric}</div>)}
            {locations.map((location, rowIndex) => (
              <Fragment key={location}>
                <strong key={`${location}-label`} className="rounded bg-paper p-3 text-sm text-ink">{location}</strong>
                {metrics.map((metric, index) => {
                  const value = Math.max(48, Math.min(94, state.enterpriseScore - rowIndex * 8 + index * 3));
                  return (
                    <div key={`${location}-${metric}`} className="rounded p-3 text-center text-sm font-black text-white" style={{ backgroundColor: value > 80 ? "#177f75" : value > 66 ? "#2f6fbd" : "#b65b3a" }}>
                      {value}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
