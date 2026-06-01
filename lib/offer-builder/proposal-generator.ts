import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { getPackage } from "@/lib/offer-builder/packages";
import type { PackageKey } from "@/lib/offer-builder/packages";
import type { OpportunityScore } from "@/lib/discovery-os/opportunity-scoring";

export interface ScopeItem {
  title: string;
  description: string;
}

export interface ProposalPricing {
  packageName: string;
  monthlyPrice: number;
  setupFee: number;
  annualCommitmentDiscount: number;
  effectiveMonthlyWithAnnual: number;
}

export interface ProposalDocument {
  id?: string;
  organizationId: string;
  packageKey: PackageKey;
  title: string;
  executiveSummary: string;
  scopeItems: ScopeItem[];
  timeline: { phase: string; duration: string; description: string }[];
  pricing: ProposalPricing;
  roiProjection: {
    day30: number;
    day60: number;
    day90: number;
    roiMultiple: number;
  };
  createdAt?: string;
}

export function generateProposal(
  organizationId: string,
  packageKey: PackageKey,
  score: OpportunityScore
): ProposalDocument {
  const pkg = getPackage(packageKey);
  const locationLabel = pkg.locations === -1 ? "unlimited" : String(pkg.locations);

  const scopeItems: ScopeItem[] = [
    {
      title: "Automated Recall Campaigns",
      description:
        "Reactivate lapsed patients and keep your chairs full with AI-driven recall reminders.",
    },
    {
      title: "No-Show Recovery",
      description: `Recover up to $${score.noShowOpportunity.toLocaleString()}/month in lost revenue with automated follow-up sequences.`,
    },
    {
      title: "Review Generation",
      description:
        "Systematically request and route 5-star reviews to your preferred platforms.",
    },
  ];

  if (packageKey === "growth" || packageKey === "scale" || packageKey === "enterprise") {
    scopeItems.push({
      title: "Reactivation Engine",
      description: "Re-engage inactive patients with personalized outreach sequences.",
    });
    scopeItems.push({
      title: "Missed Call Recovery",
      description: "Capture revenue from every missed call with instant AI text-back.",
    });
  }

  if (packageKey === "scale" || packageKey === "enterprise") {
    scopeItems.push({
      title: "Treatment Follow-up",
      description: "Close more cases with automated post-consultation follow-up.",
    });
    scopeItems.push({
      title: "Insurance Verification Automation",
      description: "Eliminate manual verification calls — save hours every week.",
    });
  }

  const monthlyValue =
    score.revenueOpportunity +
    score.laborSavingsOpportunity +
    score.growthOpportunity;

  const roiMultiple =
    pkg.price > 0 ? parseFloat((monthlyValue / pkg.price).toFixed(1)) : 0;

  return {
    organizationId,
    packageKey,
    title: `Zenith AI ${pkg.name} — Custom Automation Proposal`,
    executiveSummary: `Based on our discovery assessment, your practice has an estimated $${monthlyValue.toLocaleString()}/month in recoverable opportunity. The Zenith AI ${pkg.name} package delivers the workflows and AI agents needed to capture this value across ${locationLabel} location${pkg.locations !== 1 ? "s" : ""}.`,
    scopeItems,
    timeline: [
      {
        phase: "Onboarding",
        duration: "Week 1",
        description: "PMS integration, workflow configuration, and staff training.",
      },
      {
        phase: "Activation",
        duration: "Week 2-3",
        description: "Go-live on recall, no-show, and review workflows.",
      },
      {
        phase: "Optimization",
        duration: "Day 30+",
        description: "Performance review, A/B testing, and expansion of active workflows.",
      },
    ],
    pricing: {
      packageName: pkg.name,
      monthlyPrice: pkg.price,
      setupFee: pkg.price > 0 ? 497 : 0,
      annualCommitmentDiscount: 0.15,
      effectiveMonthlyWithAnnual:
        pkg.price > 0 ? Math.round(pkg.price * 0.85) : 0,
    },
    roiProjection: {
      day30: Math.round(monthlyValue * 0.25),
      day60: Math.round(monthlyValue * 0.6),
      day90: Math.round(monthlyValue),
      roiMultiple,
    },
  };
}

export async function saveProposal(
  organizationId: string,
  proposal: ProposalDocument
): Promise<ProposalDocument | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("offers")
    .insert(({
      organization_id: organizationId,
      package_key: proposal.packageKey,
      title: proposal.title,
      proposal_data: proposal as unknown as Record<string, unknown>,
    } as never))
    .select("id, created_at")
    .single();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  return {
    ...proposal,
    id: row.id as string,
    createdAt: row.created_at as string,
  };
}

export async function listProposals(
  organizationId: string
): Promise<ProposalDocument[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("offers")
    .select("id, created_at, proposal_data")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return (data as Record<string, unknown>[]).map((row) => ({
    ...(row.proposal_data as ProposalDocument),
    id: row.id as string,
    createdAt: row.created_at as string,
  }));
}
