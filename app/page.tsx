import { ProsLanding } from "@/components/public/pros-landing";
import { getAdminDashboardData } from "@/lib/data/leads";
import { LEGAL_ENTITY } from "@/lib/legal-entity";

export default async function HomePage() {
  const admin = await getAdminDashboardData();
  const revenueRecovery = admin.roiCalculations.reduce((sum, item) => {
    return sum + Number(item.revenue_recovery_opportunity ?? item.recoverable_revenue ?? 0);
  }, 0);
  const assessmentCount = admin.leads.filter(lead => lead.source === "free_revenue_opportunity_assessment").length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: "Zenith AI Automation Agency",
    description: "Dental practice revenue recovery — identify and recover lost revenue through intelligent patient engagement, recall recovery, and treatment acceptance.",
    url: "https://zenith.dental",
    areaServed: "US",
    medicalSpecialty: "Dentistry"
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProsLanding
        landingStats={{ assessmentCount, revenueRecovery }}
        legalEntity={LEGAL_ENTITY}
      />
    </>
  );
}
