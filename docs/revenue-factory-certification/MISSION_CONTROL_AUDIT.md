# Mission Control Audit — Revenue Workforce Section

File read in full: `/home/user/ZenithDentist-AI-agency/app/mission-control/agents/page.tsx` (347 lines).

## Revenue Workforce section (lines 240-268)

Data sourced from `workforceCards` (built at lines 113-128), which derives from:
- `stats` — `AgentAnalyticsEngine.getAgentStats(agent.id)` (called at line 79, real per-agent query, not inline in this file).
- `revenueAtRisk` (line 110) = `leakage.reduce((sum,entry)=>sum+entry.revenueAtRisk,0)` where `leakage` comes from `RevenueLeakageEngine.detectLeakage(tenantData.organization.id)` (line 105) — a real query-backed engine (confirmed by reading `packages/agent-os/revenue-intelligence/RevenueLeakageEngine.ts` in full: 160 lines, queries `recall_tracking`/`roi_calculations`/`claims`/`invoices`/`bookings`/referral tables via `countAndSum()` helper, applies documented `RECOVERY_RATE` per category, e.g. `claims_leakage: 0.5`). No hardcoded leakage numbers — the function returns `[]` only when Supabase is unavailable (line 50), not as a default demo value.
- `revenueOpportunities` (line 111) = sum of `OpportunityEngine.detectOpportunities(...)` (line 106) — same pattern, real aggregation engine (48 lines).
- `revenueRecovered` per card (line 120) = `stat?.revenueInfluenced ?? 0` — pulled from `AgentAnalyticsEngine` stats, which themselves derive from `agent_executions`/`agent_revenue_attribution` (per file header comment line 1-3: "Read-only ops view over Batches 1-10... no new aggregation pipeline").

## Grep for suspicious literals

Ran `grep -n "= [0-9]\{2,\}\|Math.random\|\"\\$[0-9]" app/mission-control/agents/page.tsx` — **zero matches**. No hardcoded dollar strings, no `Math.random()`, no inline numeric seed values anywhere in the file. The only numeric literals in the file are array-slice bounds (`.slice(0, 9)`, `.slice(0, 5)`) for display truncation, not data values.

## Conditional empty-state handling

Lines 103-108: `leakage`/`opportunities` are explicitly set to `[]` when `tenantData.organization?.id` is falsy — this is a genuine "no data available" fallback, not a disguised demo seed (`[]` produces `$0.00` on render via `.reduce`, not a fake non-zero number).

## Verdict

**PASS.** Every number rendered in the Revenue Workforce section traces to a real Supabase-backed query/aggregation engine (`AgentAnalyticsEngine`, `RevenueLeakageEngine`, `OpportunityEngine`, `AgentRevenueAttributionStore`). No hardcoded/seeded/demo literals found.
