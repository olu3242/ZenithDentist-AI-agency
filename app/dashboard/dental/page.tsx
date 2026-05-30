import { computeTenantRoi } from "@/lib/roi-os/roi-engine";
import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";

export const metadata = { title: "Dental Dashboard | Zenith" };

interface StatCardProps {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
  trendLabel: string;
  accent?: string;
}

function StatCard({ label, value, trend, trendLabel, accent = "indigo" }: StatCardProps) {
  const trendColor =
    trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-gray-400";
  const trendArrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

  const accentClasses: Record<string, string> = {
    indigo: "border-indigo-500/40 bg-indigo-500/5",
    emerald: "border-emerald-500/40 bg-emerald-500/5",
    amber:   "border-amber-500/40 bg-amber-500/5",
    rose:    "border-rose-500/40 bg-rose-500/5",
    cyan:    "border-cyan-500/40 bg-cyan-500/5",
    violet:  "border-violet-500/40 bg-violet-500/5",
  };

  return (
    <div className={`rounded-xl border p-6 ${accentClasses[accent] ?? accentClasses.indigo}`}>
      <p className="text-xs font-medium uppercase tracking-widest text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      <p className={`mt-1.5 text-sm font-medium ${trendColor}`}>
        {trendArrow} {trendLabel}
      </p>
    </div>
  );
}

export default async function DentalDashboardPage() {
  const [roi, analytics] = await Promise.all([
    computeTenantRoi("demo"),
    getWorkflowAnalyticsSummary(),
  ]);

  const kpiMap = Object.fromEntries(analytics.workflowKpis.map(k => [k.workflowId, k]));

  // Derived metrics
  const revenueRecovery = `$${roi.revenueRecovered.toLocaleString()}`;
  const recallRate = `${kpiMap["recall_due"]?.successRate ?? 0}%`;
  const reviewCount = roi.reviewsGenerated;
  const chairUtilization = Math.min(
    100,
    Math.round(analytics.overallSuccessRate * 0.9)
  );
  const noShowReduction = `${Math.round(roi.noShowReductionRate * 100)}%`;
  const treatmentAcceptance = `${kpiMap["treatment_followup"]?.successRate ?? kpiMap["reactivation_candidate_detected"]?.successRate ?? 0}%`;
  const insuranceVerified = kpiMap["insurance_verification"]?.totalExecutions ?? 0;
  const practiceHealthScore = Math.round(
    (analytics.overallSuccessRate * 0.4) +
    (roi.roiMultiple > 0 ? Math.min(40, roi.roiMultiple * 4) : 0) +
    (analytics.overallRecoveryRate * 0.2)
  );

  const stats: (StatCardProps & { accent: string })[] = [
    {
      label: "Revenue Recovery",
      value: revenueRecovery,
      trend: roi.revenueRecovered > 0 ? "up" : "neutral",
      trendLabel: "Month to date",
      accent: "emerald",
    },
    {
      label: "Recall Recovery",
      value: recallRate,
      trend: (kpiMap["recall_due"]?.successRate ?? 0) >= 50 ? "up" : "down",
      trendLabel: "Success rate",
      accent: "indigo",
    },
    {
      label: "Review Growth",
      value: String(reviewCount),
      trend: reviewCount > 0 ? "up" : "neutral",
      trendLabel: "Reviews generated MTD",
      accent: "amber",
    },
    {
      label: "Chair Utilization",
      value: `${chairUtilization}%`,
      trend: chairUtilization >= 70 ? "up" : "down",
      trendLabel: "vs. baseline",
      accent: "cyan",
    },
    {
      label: "No Show Reduction",
      value: noShowReduction,
      trend: roi.noShowReductionRate > 0 ? "up" : "neutral",
      trendLabel: "Recovery rate",
      accent: "violet",
    },
    {
      label: "Treatment Acceptance",
      value: treatmentAcceptance,
      trend: "neutral",
      trendLabel: "Follow-up success",
      accent: "indigo",
    },
    {
      label: "Insurance Verified",
      value: String(insuranceVerified),
      trend: insuranceVerified > 0 ? "up" : "neutral",
      trendLabel: "Verifications this period",
      accent: "rose",
    },
    {
      label: "Practice Health Score",
      value: String(Math.min(100, practiceHealthScore)),
      trend: practiceHealthScore >= 70 ? "up" : practiceHealthScore >= 40 ? "neutral" : "down",
      trendLabel: "out of 100",
      accent: "emerald",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Dental Practice Dashboard</h1>
        <p className="mt-2 text-gray-400">
          Real-time performance KPIs sourced from live workflow telemetry and ROI engine.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map(s => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Summary strip */}
      <div className="mt-10 rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">
          Platform ROI Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-emerald-400">{roi.roiMultiple}×</p>
            <p className="text-xs text-gray-500 mt-1">ROI Multiple</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">${roi.totalRoiUsd.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Total ROI USD</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-400">{roi.estimatedLaborSavingsHours}h</p>
            <p className="text-xs text-gray-500 mt-1">Labor Saved</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-400">{roi.patientReactivations}</p>
            <p className="text-xs text-gray-500 mt-1">Reactivations</p>
          </div>
        </div>
      </div>
    </main>
  );
}
