import type { DependencyIssue } from "@/lib/runtime/dependency-intelligence";

export function DependencyIssuePanel({ issues }: { issues: DependencyIssue[] }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Dependency intelligence</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Disconnected handlers, dependencies, and observability issues</h2>
      <div className="mt-5 grid gap-3">
        {issues.length ? issues.slice(0, 8).map(issue => (
          <div key={issue.id} className="rounded border border-card bg-background p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <strong className="text-sm font-black text-[#F8FAFC]">{issue.workflowId}</strong>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-danger">{issue.severity}</span>
            </div>
            <p className="mt-1 text-xs font-black uppercase tracking-wider text-muted">{issue.category.replace(/_/g, " ")}</p>
            <p className="mt-2 text-sm font-semibold text-muted">{issue.detail}</p>
          </div>
        )) : (
          <div className="rounded border border-card bg-background p-4 text-sm font-semibold text-muted">No dependency issues detected.</div>
        )}
      </div>
    </section>
  );
}
