import { PortalHeader } from "@/components/portal/portal-header";

const settings = [
  ["Reminder timing", "48 hours, 24 hours, 2 hours before appointment"],
  ["Review timing", "2 hours after completed appointment"],
  ["Recall intervals", "90, 180, and 365 day segments"],
  ["Notification preferences", "Critical failures immediately, performance digest weekly"],
  ["Reporting cadence", "Weekly executive summary, monthly board-style report"]
];

export default function PortalSettingsPage() {
  return (
    <div className="space-y-6">
      <PortalHeader title="Client Settings" subtitle="Practice-level automation preferences prepared for authenticated role-based editing." />
      <section className="grid gap-4">
        {settings.map(([label, value]) => (
          <article key={label} className="rounded border border-line bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
            <strong className="mt-2 block text-lg">{value}</strong>
          </article>
        ))}
      </section>
    </div>
  );
}
