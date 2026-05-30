import { EXTENSION_REGISTRY } from "@/lib/marketplace-core/extension-registry";

export const metadata = { title: "Dental Marketplace Blueprints | Zenith" };

export default async function DentalMarketplacePage() {
  const blueprints = EXTENSION_REGISTRY.filter(e => e.category === "automation_pack");

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Dental Blueprint Marketplace</h1>
        <p className="mt-2 text-gray-400">
          One-click automation packs built for dental practices. Deploy any blueprint to instantly
          activate the matching workflow in your practice.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {blueprints.map(bp => (
          <div
            key={bp.id}
            className="flex flex-col justify-between rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-lg"
          >
            {/* Card header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-block rounded-full bg-indigo-600/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                  {bp.category.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-gray-500">{bp.version}</span>
              </div>
              <h2 className="text-lg font-semibold mt-3">{bp.name}</h2>
              <p className="mt-1 text-sm text-gray-400 leading-relaxed">{bp.description}</p>

              {/* Included workflows */}
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Included Workflows
                </p>
                <ul className="space-y-1">
                  {bp.workflowIds.map(wfId => (
                    <li key={wfId} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                      <code className="font-mono text-xs text-indigo-300">{wfId}</code>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Required capabilities */}
              {bp.requiredCapabilities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {bp.requiredCapabilities.map(cap => (
                    <span
                      key={cap}
                      className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Deploy button */}
            <form
              action={`/api/marketplace/dental`}
              method="POST"
              className="mt-6"
            >
              <input type="hidden" name="extensionId" value={bp.id} />
              <input type="hidden" name="organizationId" value="demo" />
              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Deploy Blueprint
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
