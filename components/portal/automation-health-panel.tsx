import { CheckCircle2, XCircle } from "lucide-react";
import type { AutomationEvent } from "@/lib/data/operations";
import { formatCurrency } from "@/lib/utils";

export function AutomationHealthPanel({ events }: { events: AutomationEvent[] }) {
  const activeSystems = ["reminders", "recall", "reviews", "intake", "booking"];
  const success = events.filter(event => event.status === "succeeded").length;
  const successRate = Math.round((success / Math.max(1, events.length)) * 100);
  const recovery = events.reduce((sum, event) => sum + Number(event.recovery_amount), 0);

  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black">Automation Health</h2>
          <p className="text-sm text-muted">Reminder, recall, review, intake, and booking orchestration.</p>
        </div>
        <strong className="text-2xl text-accent">{successRate}%</strong>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {activeSystems.map(system => {
          const latest = events.find(event => event.workflow === system);
          const healthy = latest?.status !== "failed";
          return (
            <div key={system} className="rounded bg-background p-3">
              <div className={healthy ? "text-success" : "text-danger"}>
                {healthy ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              </div>
              <strong className="mt-2 block capitalize">{system}</strong>
              <small className="text-muted">{latest?.outcome ?? "No recent event"}</small>
            </div>
          );
        })}
      </div>
      <div className="mt-5 rounded bg-accent/10 p-4 text-sm font-bold text-accent">
        Recovery attributed to automations: {formatCurrency(recovery)}
      </div>
    </section>
  );
}
