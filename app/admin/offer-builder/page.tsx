import { createServiceClient } from "@/lib/supabase/server";
import { PACKAGES } from "@/lib/offer-builder/packages";

type PackageKey = "starter" | "growth" | "scale" | "enterprise";

const PACKAGE_COLORS: Record<PackageKey, string> = {
  starter: "bg-gray-100 text-gray-700",
  growth: "bg-teal-100 text-teal-700",
  scale: "bg-blue-100 text-blue-700",
  enterprise: "bg-purple-100 text-purple-700",
};

export default async function OfferBuilderPage() {
  const supabase = createServiceClient();

  let proposals: Record<string, unknown>[] = [];
  const packageCounts: Record<string, number> = {
    starter: 0,
    growth: 0,
    scale: 0,
    enterprise: 0,
  };

  if (supabase) {
    const { data } = await supabase
      .from("offers")
      .select("id, organization_id, package_key, title, created_at, proposal_data")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      proposals = data as Record<string, unknown>[];
      for (const row of proposals) {
        const key = (row.package_key as string) ?? "starter";
        if (key in packageCounts) packageCounts[key]++;
      }
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-wider text-teal-600">
          Offer Builder
        </p>
        <h1 className="mt-2 text-4xl font-black">Proposal Manager</h1>
        <p className="mt-2 max-w-3xl text-gray-500">
          Generate, manage, and track AI automation proposals for dental
          practices across all package tiers.
        </p>
      </header>

      {/* Package Distribution */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(Object.keys(PACKAGES) as PackageKey[]).map((key) => {
          const pkg = PACKAGES[key];
          return (
            <div
              key={key}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <p className="text-xs uppercase tracking-wider text-gray-400">
                {pkg.name}
              </p>
              <p className="mt-1 text-2xl font-black">{packageCounts[key] ?? 0}</p>
              <p className="mt-1 text-xs text-gray-400">
                {pkg.price > 0 ? `$${pkg.price}/mo` : "Custom pricing"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <a
          href="/admin/offer-builder/new"
          className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          + Generate Proposal
        </a>
      </div>

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-gray-700">No proposals yet</p>
          <p className="mt-2 text-sm text-gray-400">
            Run a discovery session first, then generate a proposal for the
            recommended package.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">90-Day Value</th>
                <th className="px-4 py-3">ROI Multiple</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {proposals.map((row) => {
                const proposalData = (row.proposal_data ?? {}) as Record<string, unknown>;
                const roiProjection = (proposalData.roiProjection ?? {}) as Record<string, unknown>;
                const packageKey = (row.package_key as PackageKey) ?? "starter";
                const colorClass =
                  PACKAGE_COLORS[packageKey] ?? "bg-gray-100 text-gray-700";

                return (
                  <tr key={row.id as string} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {(row.title as string) ?? "Untitled Proposal"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${colorClass}`}
                      >
                        {PACKAGES[packageKey]?.name ?? packageKey}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {roiProjection.day90 != null
                        ? `$${Number(roiProjection.day90).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {roiProjection.roiMultiple != null
                        ? `${roiProjection.roiMultiple}x`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(row.created_at as string).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
