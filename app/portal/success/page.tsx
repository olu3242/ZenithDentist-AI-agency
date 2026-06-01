import { getSuccessDashboardData } from "@/lib/client-success-os/success-dashboard";
import { getTenantData } from "@/lib/data/tenants";

export default async function SuccessPage() {
  const tenantData = await getTenantData();
  const data = await getSuccessDashboardData(tenantData.tenant.organizationId ?? tenantData.organization.id);

  const healthColor =
    data.workflowHealth === "healthy"
      ? "text-success-600 bg-success-50 border-green-200"
      : data.workflowHealth === "degraded"
      ? "text-yellow-600 bg-yellow-50 border-yellow-200"
      : "text-red-600 bg-red-50 border-red-200";

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Client Success Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Live metrics powered by Zenith AI automation</p>
      </div>

      {/* Revenue & Patient Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Revenue Recovered"
          value={`$${data.recoveredRevenue.toLocaleString()}`}
          sub="Month-to-date"
          accent="green"
        />
        <StatCard
          label="Patients Recovered"
          value={data.recoveredPatients.toLocaleString()}
          sub="Reactivations + no-shows"
          accent="blue"
        />
        <StatCard
          label="Review Growth"
          value={data.reviewGrowth.toLocaleString()}
          sub="Reviews generated"
          accent="purple"
        />
        <StatCard
          label="Recall Recovery Rate"
          value={`${data.recallRecoveryRate}%`}
          sub="Recall workflow success"
          accent={data.recallRecoveryRate >= 70 ? "green" : "yellow"}
        />
      </div>

      {/* Workflow Health + Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Workflow Health Badge */}
        <div className={`rounded-xl border p-5 flex flex-col gap-2 ${healthColor}`}>
          <span className="text-xs font-semibold uppercase tracking-wide">Workflow Health</span>
          <span className="text-3xl font-bold capitalize">{data.workflowHealth}</span>
          <span className="text-xs">{data.automationStatus.length} automations tracked</span>
        </div>

        {/* Open Tickets */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Open Tickets</span>
          <span className="text-3xl font-bold text-gray-900">{data.openTickets}</span>
          <span className="text-xs text-gray-400">{data.closedTickets} closed this period</span>
        </div>

        {/* Closed Tickets */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Closed Tickets</span>
          <span className="text-3xl font-bold text-success-600">{data.closedTickets}</span>
          <span className="text-xs text-gray-400">
            {data.openTickets + data.closedTickets > 0
              ? `${Math.round((data.closedTickets / (data.openTickets + data.closedTickets)) * 100)}% resolution rate`
              : "No tickets recorded"}
          </span>
        </div>
      </div>

      {/* Automation Status Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Automation Status</h2>
        </div>
        {data.automationStatus.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400">No automation workflows found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Workflow</th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Last Run</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.automationStatus.map(wf => (
                <tr key={wf.workflowId}>
                  <td className="px-5 py-3 font-mono text-xs text-gray-700">{wf.workflowId}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        wf.status === "healthy"
                          ? "bg-success-100 text-success-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {wf.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {wf.lastRun ? new Date(wf.lastRun).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Shared Stat Card ────────────────────────────────────────────────────────

type AccentColor = "green" | "blue" | "purple" | "yellow";

const accentMap: Record<AccentColor, string> = {
  green: "border-green-200 bg-success-50 text-success-700",
  blue: "border-blue-200 bg-primary-50 text-primary-700",
  purple: "border-purple-200 bg-purple-50 text-purple-700",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
};

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: AccentColor;
}) {
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-1 ${accentMap[accent]}`}>
      <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</span>
      <span className="text-3xl font-bold">{value}</span>
      <span className="text-xs opacity-60">{sub}</span>
    </div>
  );
}
