import { getTenantData } from "@/lib/data/tenants";
import { getDeploymentProject } from "@/lib/deployment-os/deployment-tracker";

const STAGE_ORDER = [
  "discovery", "audit", "proposal", "kickoff",
  "build", "qa", "go_live", "optimization", "qbr",
] as const;

const STAGE_LABELS: Record<string, string> = {
  discovery: "Discovery",
  audit: "Audit",
  proposal: "Proposal",
  kickoff: "Kickoff",
  build: "Build",
  qa: "QA",
  go_live: "Go Live",
  optimization: "Optimization",
  qbr: "QBR",
};

export default async function DeploymentPage() {
  const tenantData = await getTenantData();
  const project = await getDeploymentProject(tenantData.tenant.organizationId ?? tenantData.organization.id);
  const currentIndex = STAGE_ORDER.indexOf(project.stage as typeof STAGE_ORDER[number]);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deployment Blueprint</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track your practice&apos;s implementation journey through all 9 stages.
        </p>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Overall Progress</span>
          <span className="font-semibold text-gray-700">{project.completionPercent}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${project.completionPercent}%` }}
          />
        </div>
      </div>

      {/* Stage pipeline */}
      <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
        {STAGE_ORDER.map((stage, i) => {
          const isPast = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;
          return (
            <div
              key={stage}
              className={`rounded-lg border p-3 text-center text-xs font-medium ${
                isCurrent
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : isPast
                  ? "bg-success-50 border-green-200 text-success-700"
                  : "bg-gray-50 border-gray-200 text-gray-400"
              }`}
            >
              <div className="mb-1 text-base">{isPast ? "✓" : isCurrent ? "●" : "○"}</div>
              {STAGE_LABELS[stage]}
            </div>
          );
        })}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Stage</div>
          <div className="text-xl font-bold text-indigo-700">{STAGE_LABELS[project.stage] ?? project.stage}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Owner</div>
          <div className="text-xl font-bold text-gray-800">{project.owner ?? "—"}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Due Date</div>
          <div className="text-xl font-bold text-gray-800">
            {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "—"}
          </div>
        </div>
      </div>

      {/* Risks & Dependencies */}
      {project.risks.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
          <div className="text-sm font-semibold text-yellow-800 mb-2">Risks</div>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            {project.risks.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
