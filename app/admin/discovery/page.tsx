import { createServiceClient } from "@/lib/supabase/server";
import { getTenantData } from "@/lib/data/tenants";

type DiscoverySession = {
  id: string;
  organization_id: string;
  practice_name: string | null;
  created_at: string;
  no_show_rate: number | null;
  monthly_revenue: number | null;
  recall_rate: number | null;
};

type DiscoveryQueryResult<T> = {
  data: T[] | null;
  count?: number | null;
};

type DiscoveryRowsQuery<T> = PromiseLike<DiscoveryQueryResult<T>> & {
  eq(column: string, value: string): DiscoveryRowsQuery<T>;
  order(column: string, options: { ascending: boolean }): DiscoveryRowsQuery<T>;
  limit(count: number): DiscoveryRowsQuery<T>;
};

type DiscoveryCountQuery = PromiseLike<DiscoveryQueryResult<never>> & {
  eq(column: string, value: string): DiscoveryCountQuery;
};

type DiscoveryTableQuery<T> = {
  select(columns: string): DiscoveryRowsQuery<T>;
};

type CountTableQuery = {
  select(columns: string, options: { count: "exact"; head: true }): DiscoveryCountQuery;
};

type DiscoveryReadClient = {
  from(table: "discovery_sessions"): DiscoveryTableQuery<DiscoverySession>;
  from(table: "opportunity_scores"): CountTableQuery;
};

export default async function DiscoveryPage() {
  const supabase = createServiceClient();
  const tenantData = await getTenantData();
  const organizationId = tenantData.tenant.organizationId;

  let sessions: DiscoverySession[] = [];
  let totalOpportunities = 0;

  if (supabase) {
    const discoveryClient = supabase as unknown as DiscoveryReadClient;
    const sessionQuery = discoveryClient
      .from("discovery_sessions")
      .select("id, organization_id, practice_name, created_at, no_show_rate, monthly_revenue, recall_rate")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: sessionRows } = organizationId
      ? await sessionQuery.eq("organization_id", organizationId)
      : await sessionQuery;
    sessions = (sessionRows ?? []).map(mapDiscoverySession);

    const oppQuery = discoveryClient
      .from("opportunity_scores")
      .select("id", { count: "exact", head: true });

    const { count } = organizationId
      ? await oppQuery.eq("organization_id", organizationId)
      : await oppQuery;
    totalOpportunities = count ?? 0;
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-wider text-accent-600">
          Discovery OS
        </p>
        <h1 className="mt-2 text-4xl font-black">Practice Discovery</h1>
        <p className="mt-2 max-w-3xl text-gray-500">
          Assess dental practices, score their opportunity, and generate ROI
          projections for the sales process.
        </p>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Discovery Sessions" value={String(sessions.length)} />
        <StatCard label="Opportunities Scored" value={String(totalOpportunities)} />
        <StatCard label="Avg Session ROI" value="—" />
      </div>

      {/* CTA */}
      <div className="flex items-center gap-3">
        <a
          href="/admin/discovery/new"
          className="inline-flex items-center rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700"
        >
          + New Discovery Session
        </a>
      </div>

      {/* Session List */}
      {sessions.length === 0 ? (
        <EmptyState
          title="No discovery sessions yet"
          description="Start a discovery session to assess a dental practice and generate an ROI projection."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Practice</th>
                <th className="px-4 py-3">Monthly Revenue</th>
                <th className="px-4 py-3">No-Show Rate</th>
                <th className="px-4 py-3">Recall Rate</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {session.practice_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    ${Number(session.monthly_revenue ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {Number(session.no_show_rate ?? 0).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">
                    {Number(session.recall_rate ?? 0).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(session.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function mapDiscoverySession(row: DiscoverySession): DiscoverySession {
  return {
    id: row.id,
    organization_id: row.organization_id,
    practice_name: row.practice_name,
    created_at: row.created_at,
    no_show_rate: row.no_show_rate,
    monthly_revenue: row.monthly_revenue,
    recall_rate: row.recall_rate
  };
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
      <p className="text-lg font-semibold text-gray-700">{title}</p>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
    </div>
  );
}
