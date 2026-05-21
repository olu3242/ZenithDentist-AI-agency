"use client";

import { useMemo, useState } from "react";
import { runOperationalSimulation } from "@/lib/autonomous";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type Simulation = Awaited<ReturnType<typeof runOperationalSimulation>>;

const baseline: Simulation = {
  projectedRevenueImpact: 4200,
  projectedNoShowReduction: 3.1,
  projectedRetentionChange: 6.2,
  projectedStaffingLoad: 76,
  projectedEfficiency: 72,
  confidence: 0.81
};

export function OperationalSimulator() {
  const [reminderTimingDelta, setReminderTimingDelta] = useState(2);
  const [recallCadenceDelta, setRecallCadenceDelta] = useState(3);
  const [staffingDelta, setStaffingDelta] = useState(1);
  const simulation = useMemo<Simulation>(() => ({
    ...baseline,
    projectedRevenueImpact: baseline.projectedRevenueImpact + recallCadenceDelta * 310,
    projectedNoShowReduction: baseline.projectedNoShowReduction + reminderTimingDelta * 0.4,
    projectedRetentionChange: baseline.projectedRetentionChange + recallCadenceDelta * 0.7,
    projectedStaffingLoad: baseline.projectedStaffingLoad - staffingDelta * 4,
    projectedEfficiency: baseline.projectedEfficiency + staffingDelta * 3
  }), [recallCadenceDelta, reminderTimingDelta, staffingDelta]);

  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">What-if Operational Simulator</h2>
      <p className="text-sm text-muted">Model staffing, reminder timing, recall cadence, and review timing before approval.</p>
      <div className="mt-5 grid gap-4">
        <Slider label="Reminder timing change" value={reminderTimingDelta} setValue={setReminderTimingDelta} />
        <Slider label="Recall cadence intensity" value={recallCadenceDelta} setValue={setRecallCadenceDelta} />
        <Slider label="Staffing adjustment" value={staffingDelta} setValue={setStaffingDelta} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Result label="Revenue impact" value={formatCurrency(simulation.projectedRevenueImpact)} />
        <Result label="No-show reduction" value={`${simulation.projectedNoShowReduction.toFixed(1)}%`} />
        <Result label="Efficiency" value={`${simulation.projectedEfficiency.toFixed(1)}%`} />
      </div>
      <Button className="mt-5" type="button">Queue for Review</Button>
    </section>
  );
}

function Slider({ label, value, setValue }: { label: string; value: number; setValue: (value: number) => void }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-muted">{label}: {value}</span>
      <input className="w-full" min="0" max="6" type="range" value={value} onChange={event => setValue(Number(event.target.value))} />
    </label>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-paper p-4">
      <span className="text-xs font-black uppercase tracking-wider text-muted">{label}</span>
      <strong className="mt-2 block text-xl">{value}</strong>
    </div>
  );
}
