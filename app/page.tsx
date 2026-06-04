import { ProsLanding } from "@/components/public/pros-landing";
import { getAdminDashboardData } from "@/lib/data/leads";
import { LEGAL_ENTITY } from "@/lib/legal-entity";
import { env } from "@/lib/env";

export default async function HomePage() {
  const admin = await getAdminDashboardData();
  const revenueRecovery = admin.roiCalculations.reduce((sum, item) => {
    return sum + Number(item.revenue_recovery_opportunity ?? item.recoverable_revenue ?? 0);
  }, 0);
  const assessmentCount = admin.leads.filter(lead => lead.source === "free_revenue_opportunity_assessment").length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: "Zenith Pros",
    description: "Patient Revenue Operating System for dental practice revenue recovery, intelligent patient engagement, recall recovery, and treatment acceptance.",
    url: "https://zenithprosai.com",
    areaServed: "US",
    medicalSpecialty: "Dentistry"
  };

  return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProsLanding
        calendlyUrl={env.CALENDLY_URL}
        landingStats={{ assessmentCount, revenueRecovery }}
        legalEntity={LEGAL_ENTITY}
      />
    </>
  );
}
