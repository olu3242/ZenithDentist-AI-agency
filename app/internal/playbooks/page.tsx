import { PlaybookManager } from "@/components/autonomous/playbook-manager";
import { InternalHeader } from "@/components/internal/internal-header";
import { getAutonomousPlaybooks } from "@/lib/autonomous";

export default function InternalPlaybooksPage() {
  return (
    <div className="space-y-6">
      <InternalHeader title="Operational Playbooks" subtitle="Approval-gated corrective systems with goals, expected outcomes, and rollback logic." />
      <PlaybookManager playbooks={getAutonomousPlaybooks()} />
    </div>
  );
}
