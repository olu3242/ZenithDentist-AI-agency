import { OperationalResilienceRadar } from "@/components/mission-control/operational-resilience-radar";
import { QueuePressureMonitor } from "@/components/mission-control/queue-pressure-monitor";
import { InternalHeader } from "@/components/internal/internal-header";
import { getMissionControlState } from "@/lib/stability";

export default async function InternalResiliencePage() {
  const state = await getMissionControlState();
  return (
    <div className="space-y-6">
      <InternalHeader title="Operational Resilience" subtitle="Queue stability, degraded-mode readiness, retry pressure, and safe recovery flow visibility." />
      <OperationalResilienceRadar state={state} />
      <QueuePressureMonitor state={state} />
    </div>
  );
}
