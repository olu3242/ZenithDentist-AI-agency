import { ProsLanding } from "@/components/public/pros-landing";
import { getAdminDashboardData } from "@/lib/data/leads";
import { env } from "@/lib/env";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";

export default async function HomePage() {
  const [admin, runtime] = await Promise.all([
    getAdminDashboardData(),
    getRuntimeHealthState()
  ]);
  const revenueRecovery = admin.roiCalculations.reduce((sum, item) => {
    return sum + Number(item.revenue_recovery_opportunity ?? item.recoverable_revenue ?? 0);
  }, 0);
  const assessmentCount = admin.leads.filter(lead => lead.source === "free_revenue_opportunity_assessment").length;
  const latestHealth = admin.roiCalculations.find(item => item.practice_health_score)?.practice_health_score ?? 0;
  const landingStats = {
    revenueRecovered: revenueRecovery,
    assessments: assessmentCount,
    practiceHealthScore: latestHealth,
    runtimeOperationalScore: runtime.scores.operationalScore,
    activeAutomations: runtime.traces.filter(trace => trace.status === "running" || trace.status === "completed").length,
    runtimeErrorCount: runtime.traces.filter(trace => trace.status === "failed").length
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Zenith PROS - Patient Revenue Operating System",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "Patient Revenue Operating System for dental practice revenue recovery, workflow automation, ALICE insights, and Mission Control operations."
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProsLanding calendlyUrl={env.CALENDLY_URL} landingStats={landingStats} />
    </>
  );
}
