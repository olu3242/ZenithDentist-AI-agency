import { EventLineageViewer } from "@/components/mission-control/event-lineage-viewer";
import { QueueHealthPanel } from "@/components/mission-control/queue-health-panel";
import { QueueTopologyMap } from "@/components/mission-control/queue-topology-map";
import { InternalHeader } from "@/components/internal/internal-header";
import { getMissionControlState } from "@/lib/stability";

export default async function InternalEventsPage() {
  const state = await getMissionControlState();
  return (
    <div className="space-y-6">
      <InternalHeader title="Event Operations" subtitle="Idempotent queues, event lineage, correlation IDs, retry pressure, and replay-safe event infrastructure." />
      <QueueTopologyMap state={state} />
      <QueueHealthPanel state={state} />
      <EventLineageViewer state={state} />
    </div>
  );
}
