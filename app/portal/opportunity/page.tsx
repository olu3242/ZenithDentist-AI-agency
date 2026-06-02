import { PortalShell, DashboardContainer, KpiGrid, ActionGrid } from "@/components/shell";
import { getPortalData, summarizePortal } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";
import type { KpiItem, ActionCard } from "@/components/shell";
import {
  RefreshCw,
  AlertTriangle,
  Stethoscope,
  Star,
  Calendar,
  Users,
} from "lucide-react";

export const metadata = { title: "Revenue Opportunity Center — Zenith AI" };

export default async function OpportunityPage() {
  const tenantData = await getTenantData();
  const data = await getPortalData();
  const summary = summarizePortal(data);
  const latest = summary.latest;

  const recallCount = Number(latest.recall_recovery_count ?? 0);
  const noShowRate = Number(latest.no_show_rate ?? 0);
  const recallRevenue = recallCount * 285; // avg recall value
  const noShowRevenue = Math.round(noShowRate * 10 * 350); // estimated
  const treatmentPipeline = Number(latest.recovered_revenue ?? 0) * 0.4;

  const kpis: KpiItem[] = [
    {
      label: "Recall Opportunity",
      value: `$${recallRevenue.toLocaleString()}`,
      tone: "accent",
      icon: RefreshCw,
      change: `${recallCount} patients due`,
      changePositive: true,
    },
    {
      label: "No-Show Risk",
      value: `${(noShowRate * 100).toFixed(0)}%`,
      tone: "warning",
      icon: AlertTriangle,
      change: `~$${noShowRevenue.toLocaleString()} at risk`,
      changePositive: false,
    },
    {
      label: "Treatment Pipeline",
      value: `$${treatmentPipeline.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      tone: "primary",
      icon: Stethoscope,
    },
    {
      label: "Recovery Rate",
      value: `${summary.automationSuccessRate}%`,
      tone: "success",
      icon: Users,
    },
  ];

  const actions: ActionCard[] = [
    {
      title: "Recall Opportunity",
      description: `${recallCount} patients overdue for recall. Launch targeted outreach to recover estimated $${recallRevenue.toLocaleString()} in hygiene revenue.`,
      icon: RefreshCw,
      href: "/portal/recall",
      tone: "primary",
      badge: recallCount > 0 ? `${recallCount} due` : undefined,
    },
    {
      title: "No-Show Risk Mitigation",
      description: `Current no-show rate is ${(noShowRate * 100).toFixed(0)}%. Activate pre-appointment reminder sequences to protect scheduled revenue.`,
      icon: AlertTriangle,
      href: "/portal/patients",
      tone: "warning",
      badge: noShowRate > 0.1 ? "High risk" : undefined,
    },
    {
      title: "Treatment Pipeline",
      description: "Patients with unscheduled treatment plans represent untapped revenue. Follow up to convert accepted plans into booked appointments.",
      icon: Stethoscope,
      href: "/portal/patients",
      tone: "primary",
    },
    {
      title: "Review Opportunity",
      description: "Happy patients who haven't left a review. A 5-star review campaign can boost new patient acquisition and organic search ranking.",
      icon: Star,
      href: "/portal/reviews",
      tone: "success",
    },
    {
      title: "Chair Fill Opportunity",
      description: "Open slots in the next 7 days. Launch same-day or next-day fill campaigns to maximize chair utilization and production.",
      icon: Calendar,
      href: "/portal/recall",
      tone: "success",
    },
    {
      title: "Referral Opportunity",
      description: "Recent patients who are likely to refer based on satisfaction signals. Activate your referral program to grow new patient volume.",
      icon: Users,
      href: "/portal/patients",
      tone: "success",
    },
  ];

  const orgName = tenantData.tenant.organizationId ?? "your practice";

  return (
    <PortalShell
      title="Revenue Opportunity Center"
      subtitle={`AI-identified revenue opportunities for ${orgName}`}
      breadcrumb={[
        { label: "Portal", href: "/portal" },
        { label: "Opportunities" },
      ]}
    >
      <DashboardContainer>
        <div className="flex flex-col gap-8">
          <KpiGrid items={kpis} cols={4} />
          <div>
            <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-muted">
              Active Opportunities
            </h2>
            <ActionGrid actions={actions} cols={3} />
          </div>
        </div>
      </DashboardContainer>
    </PortalShell>
  );
}
