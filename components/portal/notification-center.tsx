import type { Notification } from "@/lib/data/operations";

export function NotificationCenter({ notifications }: { notifications: Notification[] }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Notification Center</h2>
      <div className="mt-4 grid gap-3">
        {notifications.slice(0, 6).map(notification => (
          <article key={notification.id} className="rounded bg-background p-3">
            <div className="flex items-center justify-between gap-3">
              <strong>{notification.title}</strong>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-black capitalize">{notification.severity}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{notification.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
