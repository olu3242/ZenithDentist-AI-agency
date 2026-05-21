import { BusinessMetricGrid } from "@/components/gtm/business-metric-grid";
import { ClientSuccessPanel } from "@/components/gtm/client-success-panel";
import { DeliveryOnboardingPanel } from "@/components/gtm/delivery-onboarding-panel";
import { LeadScoringPanel } from "@/components/gtm/lead-scoring-panel";
import { ProofEnginePanel } from "@/components/gtm/proof-engine-panel";
import { SalesPipeline } from "@/components/gtm/sales-pipeline";
import { ServicePackagePanel } from "@/components/gtm/service-package-panel";
import { getBusinessGrowthState } from "@/lib/gtm/business-growth";

export default async function GTMCommandCenterPage() {
  const state = await getBusinessGrowthState();
  return (
    <main className="min-h-screen bg-paper p-5 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded border border-line bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-teal">Zenith Business Intelligence</p>
          <h1 className="mt-2 text-4xl font-black text-ink">GTM Command Center</h1>
          <p className="mt-2 max-w-4xl text-base font-semibold text-muted">
            Client acquisition, delivery oversight, operational proof, customer success, recurring revenue, and referral growth for the Patient Revenue Engine™.
          </p>
        </header>
        <BusinessMetricGrid state={state} />
        <SalesPipeline state={state} />
        <div className="grid gap-6 xl:grid-cols-2">
          <LeadScoringPanel state={state} />
          <ClientSuccessPanel state={state} />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <DeliveryOnboardingPanel state={state} />
          <ProofEnginePanel state={state} />
        </div>
        <ServicePackagePanel packages={state.packages} />
        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-muted">Authority system</p>
          <h2 className="mt-1 text-2xl font-black text-ink">Operational thought leadership</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {state.contentIdeas.map(item => (
              <div key={item} className="rounded border border-line bg-paper p-4 text-sm font-semibold text-muted">{item}</div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
