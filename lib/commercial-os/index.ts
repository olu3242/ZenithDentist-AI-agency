import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

// ---- TYPES ----

export type CommercialPackage = {
  id?: string;
  packageKey: string;
  packageName: string;
  setupFee: number;
  monthlyPrice: number;
  annualPrice?: number;
  includedFeatures: string[];
  tierOrder: number;
};

export type CommercialProposal = {
  id?: string;
  organizationId?: string;
  pipelineEntryId?: string;
  practiceName: string;
  contactName?: string;
  contactEmail?: string;
  recommendedPackageKey?: string;
  currentStateAnalysis?: Record<string, unknown>;
  revenueOpportunitySummary?: Record<string, unknown>;
  roiProjection?: Record<string, unknown>;
  pricingSummary?: Record<string, unknown>;
  implementationTimeline?: Record<string, unknown>;
  status: "draft" | "sent" | "accepted" | "declined" | "expired";
  totalSetupFee?: number;
  monthlyMrr?: number;
  notes?: string;
};

export type CommercialSubscription = {
  organizationId: string;
  packageKey: string;
  monthlyMrr: number;
  status: "trial" | "active" | "past_due" | "cancelled" | "churned";
  healthScore?: number;
};

export type CommercialDashboard = {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  churnedThisMonth: number;
  packageDistribution: Record<string, number>;
  openProposals: number;
  proposalValuePipeline: number;
  recentContracts: number;
};

// ---- PACKAGES ----

export async function getPackages(): Promise<CommercialPackage[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await (supabase as any)
    .from("commercial_packages")
    .select(
      "id, package_key, package_name, setup_fee, monthly_price, annual_price, included_features, tier_order"
    )
    .eq("is_active", true)
    .order("tier_order", { ascending: true });

  return ((data ?? []) as any[]).map((r: any) => ({
    id: r.id as string,
    packageKey: r.package_key as string,
    packageName: r.package_name as string,
    setupFee: Number(r.setup_fee ?? 0),
    monthlyPrice: Number(r.monthly_price ?? 0),
    annualPrice: r.annual_price != null ? Number(r.annual_price) : undefined,
    includedFeatures: (r.included_features as string[]) ?? [],
    tierOrder: Number(r.tier_order ?? 0),
  }));
}

// ---- PROPOSALS ----

export async function createProposal(
  proposal: CommercialProposal
): Promise<string> {
  const supabase = createServiceClient();
  const id = crypto.randomUUID();
  if (supabase) {
    const { data, error } = await (supabase as any)
      .from("commercial_proposals")
      .insert({
        id,
        organization_id: proposal.organizationId ?? null,
        pipeline_entry_id: proposal.pipelineEntryId ?? null,
        practice_name: proposal.practiceName,
        contact_name: proposal.contactName ?? null,
        contact_email: proposal.contactEmail ?? null,
        recommended_package_key: proposal.recommendedPackageKey ?? null,
        current_state_analysis: proposal.currentStateAnalysis ?? null,
        revenue_opportunity_summary: proposal.revenueOpportunitySummary ?? null,
        roi_projection: proposal.roiProjection ?? null,
        pricing_summary: proposal.pricingSummary ?? null,
        implementation_timeline: proposal.implementationTimeline ?? null,
        status: proposal.status,
        total_setup_fee: proposal.totalSetupFee ?? null,
        monthly_mrr: proposal.monthlyMrr ?? null,
        notes: proposal.notes ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (!error && data) {
      (async () => {
        try {
          await publishRuntimeFabricEvent({
            eventKey: "proposal_created",
            eventType: "governance",
            sourceSystem: "commercial_os",
            targetChannel: "mission_control",
            priority: "moderate",
            summary: `Proposal created for ${proposal.practiceName}`,
            payload: { proposalId: data.id, practiceName: proposal.practiceName },
          });
        } catch {}
      })();
      return data.id as string;
    }
  }
  return id;
}

export async function updateProposalStatus(
  proposalId: string,
  status: CommercialProposal["status"]
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "sent") update["sent_at"] = new Date().toISOString();
  if (status === "accepted") update["accepted_at"] = new Date().toISOString();

  await (supabase as any)
    .from("commercial_proposals")
    .update(update)
    .eq("id", proposalId);

  if (status === "sent" || status === "accepted") {
    (async () => {
      try {
        await publishRuntimeFabricEvent({
          eventKey: status === "sent" ? "proposal_sent" : "proposal_accepted",
          eventType: "governance",
          sourceSystem: "commercial_os",
          targetChannel: "mission_control",
          priority: "moderate",
          summary: `Proposal ${status}: ${proposalId}`,
          payload: { proposalId, status },
        });
      } catch {}
    })();
  }
}

export async function getProposals(filters?: {
  status?: string;
  organizationId?: string;
}): Promise<CommercialProposal[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  let query = (supabase as any)
    .from("commercial_proposals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.organizationId) {
    query = query.eq("organization_id", filters.organizationId);
  }

  const { data } = await query;
  return ((data ?? []) as any[]).map((r: any) => ({
    id: r.id as string,
    organizationId: r.organization_id as string | undefined,
    pipelineEntryId: r.pipeline_entry_id as string | undefined,
    practiceName: r.practice_name as string,
    contactName: r.contact_name as string | undefined,
    contactEmail: r.contact_email as string | undefined,
    recommendedPackageKey: r.recommended_package_key as string | undefined,
    currentStateAnalysis: r.current_state_analysis as Record<string, unknown> | undefined,
    revenueOpportunitySummary: r.revenue_opportunity_summary as Record<string, unknown> | undefined,
    roiProjection: r.roi_projection as Record<string, unknown> | undefined,
    pricingSummary: r.pricing_summary as Record<string, unknown> | undefined,
    implementationTimeline: r.implementation_timeline as Record<string, unknown> | undefined,
    status: r.status as CommercialProposal["status"],
    totalSetupFee: r.total_setup_fee != null ? Number(r.total_setup_fee) : undefined,
    monthlyMrr: r.monthly_mrr != null ? Number(r.monthly_mrr) : undefined,
    notes: r.notes as string | undefined,
  }));
}

// ---- CONTRACTS ----

export async function createContract(opts: {
  organizationId?: string;
  proposalId?: string;
  practiceName: string;
  packageKey: string;
  monthlyMrr: number;
  setupFee: number;
  termMonths?: number;
}): Promise<string> {
  const supabase = createServiceClient();
  const id = crypto.randomUUID();
  if (supabase) {
    const { data, error } = await (supabase as any)
      .from("commercial_contracts")
      .insert({
        id,
        organization_id: opts.organizationId ?? null,
        proposal_id: opts.proposalId ?? null,
        practice_name: opts.practiceName,
        package_key: opts.packageKey,
        monthly_mrr: opts.monthlyMrr,
        setup_fee: opts.setupFee,
        term_months: opts.termMonths ?? 12,
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (!error && data) return data.id as string;
  }
  return id;
}

export async function signContract(contractId: string): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  await (supabase as any)
    .from("commercial_contracts")
    .update({
      status: "signed",
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId);

  (async () => {
    try {
      await publishRuntimeFabricEvent({
        eventKey: "contract_signed",
        eventType: "governance",
        sourceSystem: "commercial_os",
        targetChannel: "mission_control",
        priority: "high",
        summary: `Contract signed: ${contractId}`,
        payload: { contractId },
      });
    } catch {}
  })();
}

// ---- SUBSCRIPTIONS ----

export async function activateSubscription(
  organizationId: string,
  contractId: string,
  packageKey: string,
  monthlyMrr: number
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  await Promise.all([
    (supabase as any)
      .from("commercial_subscriptions")
      .upsert(
        {
          organization_id: organizationId,
          package_key: packageKey,
          monthly_mrr: monthlyMrr,
          status: "active",
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id" }
      ),
    (supabase as any)
      .from("commercial_contracts")
      .update({
        status: "active",
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId),
  ]);

  (async () => {
    try {
      await publishRuntimeFabricEvent({
        eventKey: "subscription_activated",
        eventType: "governance",
        sourceSystem: "commercial_os",
        targetChannel: "mission_control",
        priority: "high",
        summary: `Subscription activated for org ${organizationId} — package ${packageKey} at $${monthlyMrr}/mo`,
        payload: { organizationId, contractId, packageKey, monthlyMrr },
      });
    } catch {}
  })();
}

// ---- DASHBOARD ----

export async function getCommercialDashboard(): Promise<CommercialDashboard> {
  const supabase = createServiceClient();

  let mrr = 0;
  let activeSubscriptions = 0;
  let trialSubscriptions = 0;
  let churnedThisMonth = 0;
  const packageDistribution: Record<string, number> = {};
  let openProposals = 0;
  let proposalValuePipeline = 0;
  let recentContracts = 0;

  if (supabase) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthStr = startOfMonth.toISOString();

    const [
      activeResult,
      trialResult,
      churnResult,
      distResult,
      proposalResult,
      contractResult,
    ] = await Promise.all([
      (supabase as any)
        .from("commercial_subscriptions")
        .select("monthly_mrr")
        .eq("status", "active"),
      (supabase as any)
        .from("commercial_subscriptions")
        .select("id")
        .eq("status", "trial"),
      (supabase as any)
        .from("commercial_subscriptions")
        .select("id")
        .eq("status", "churned")
        .gte("cancelled_at", startOfMonthStr),
      (supabase as any)
        .from("commercial_subscriptions")
        .select("package_key"),
      (supabase as any)
        .from("commercial_proposals")
        .select("monthly_mrr")
        .in("status", ["draft", "sent"]),
      (supabase as any)
        .from("commercial_contracts")
        .select("id")
        .eq("status", "signed")
        .gte("created_at", startOfMonthStr),
    ]);

    const activeRows: any[] = activeResult.data ?? [];
    activeSubscriptions = activeRows.length;
    mrr = activeRows.reduce(
      (sum: number, r: any) => sum + Number(r.monthly_mrr ?? 0),
      0
    );

    trialSubscriptions = ((trialResult.data ?? []) as any[]).length;
    churnedThisMonth = ((churnResult.data ?? []) as any[]).length;

    for (const r of (distResult.data ?? []) as any[]) {
      const key = r.package_key as string;
      packageDistribution[key] = (packageDistribution[key] ?? 0) + 1;
    }

    const proposalRows: any[] = proposalResult.data ?? [];
    openProposals = proposalRows.length;
    proposalValuePipeline = proposalRows.reduce(
      (sum: number, r: any) => sum + Number(r.monthly_mrr ?? 0),
      0
    );

    recentContracts = ((contractResult.data ?? []) as any[]).length;
  }

  return {
    mrr: Math.round(mrr),
    arr: Math.round(mrr * 12),
    activeSubscriptions,
    trialSubscriptions,
    churnedThisMonth,
    packageDistribution,
    openProposals,
    proposalValuePipeline: Math.round(proposalValuePipeline),
    recentContracts,
  };
}

export async function getSubscriptionHealth(): Promise<
  Array<{
    organizationId: string;
    packageKey: string;
    monthlyMrr: number;
    status: string;
    healthScore: number;
  }>
> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await (supabase as any)
    .from("commercial_subscriptions")
    .select("organization_id, package_key, monthly_mrr, status, health_score")
    .order("health_score", { ascending: true });

  return ((data ?? []) as any[]).map((r: any) => ({
    organizationId: r.organization_id as string,
    packageKey: r.package_key as string,
    monthlyMrr: Number(r.monthly_mrr ?? 0),
    status: r.status as string,
    healthScore: Number(r.health_score ?? 0),
  }));
}
