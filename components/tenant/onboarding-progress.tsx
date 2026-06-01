import type { Organization } from "@/lib/data/tenants";

const steps = [
  ["baseline", "Operational baseline"],
  ["pms", "PMS setup"],
  ["workflows", "Workflow configuration"],
  ["reminders", "Reminder timing"],
  ["recall", "Recall preferences"],
  ["review", "Review and go-live"]
];

export function OnboardingProgress({ organization }: { organization: Organization }) {
  const activeIndex = Math.max(1, steps.findIndex(([key]) => key === organization.onboarding_status));
  return (
    <section className="rounded border border-card bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-accent">Consultative onboarding</p>
      <h2 className="mt-2 text-2xl font-black">Practice operating model setup</h2>
      <div className="mt-6 grid gap-3">
        {steps.map(([key, label], index) => {
          const complete = index <= activeIndex;
          return (
            <div key={key} className="flex items-center gap-3 rounded bg-background p-4">
              <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-black ${complete ? "bg-accent text-white" : "bg-white text-muted"}`}>{index + 1}</span>
              <div>
                <strong>{label}</strong>
                <p className="text-sm text-muted">{complete ? "Configured or in progress" : "Queued for implementation"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
