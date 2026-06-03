# Sales OS

## Overview

Sales OS is the standardized pipeline management system for Zenith. It defines the 8 stages a prospect moves through from first contact to closed deal, the database schema supporting the pipeline, stage-by-stage conversion targets, and the function signatures used by the commercialization layer.

---

## 8 Sales Stages

| Stage | Key | Probability | Description |
|-------|-----|------------|-------------|
| **Lead** | `lead` | 5% | Prospect identified; minimal qualification done |
| **Qualified** | `qualified` | 20% | Budget, authority, need, timing confirmed |
| **Discovery** | `discovery` | 40% | Pain points explored; practice data reviewed |
| **Demo** | `demo` | 60% | Zenith demo delivered or scheduled |
| **Proposal** | `proposal` | 75% | Written proposal + pricing sent |
| **Negotiation** | `negotiation` | 85% | Pricing/terms being finalized |
| **Closed Won** | `closed_won` | 100% | Contract signed; implementation fee collected |
| **Closed Lost** | `closed_lost` | 0% | Prospect not moving forward |

---

## Stage Entry and Exit Criteria

### Lead → Qualified
- **Entry:** Contact added to pipeline from any source (referral, inbound, outbound)
- **Exit criteria:** Practice owner confirmed as decision-maker; budget awareness established; identified one core pain (recall loss, treatment acceptance, reviews); agreed to a 30-minute call

### Qualified → Discovery
- **Entry:** Intro call completed
- **Exit criteria:** Discovery call completed; practice data shared (approx # of providers, patients, PMS); primary pain quantified (e.g., "$X in unaccepted treatment over 90 days")

### Discovery → Demo
- **Entry:** Pain quantified; prospect expressed interest in seeing the platform
- **Exit criteria:** Demo scheduled (or demo session completed)

### Demo → Proposal
- **Entry:** Demo delivered
- **Exit criteria:** Prospect requested proposal OR showed strong positive signal; tier recommendation confirmed

### Proposal → Negotiation
- **Entry:** Proposal sent
- **Exit criteria:** Prospect came back with questions/pushback OR verbal agreement pending contract

### Negotiation → Closed Won
- **Entry:** All objections addressed
- **Exit criteria:** Contract signed; implementation fee paid; org created in Zenith

### Negotiation → Closed Lost
- **Entry:** Any stage
- **Exit criteria:** Prospect explicitly declined OR went unresponsive >14 days after last touch

---

## Database Schema

### `sales_pipeline`

```sql
CREATE TABLE sales_pipeline (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  contact_name      TEXT,
  contact_email     TEXT,
  contact_phone     TEXT,
  source            TEXT,                 -- referral | inbound | outbound | partner | event
  stage             TEXT NOT NULL DEFAULT 'lead',
  tier_key          TEXT REFERENCES product_tiers(tier_key),
  billing_type      TEXT DEFAULT 'monthly',  -- monthly | annual
  estimated_mrr     NUMERIC(10,2),
  probability       INTEGER DEFAULT 5,       -- matches stage probability
  weighted_mrr      NUMERIC(10,2)            -- estimated_mrr * probability / 100
    GENERATED ALWAYS AS (estimated_mrr * probability / 100.0) STORED,
  close_date        DATE,
  assigned_to       TEXT,
  lost_reason       TEXT,
  notes             TEXT,
  stage_updated_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sp_stage ON sales_pipeline(stage);
CREATE INDEX idx_sp_close_date ON sales_pipeline(close_date);
CREATE INDEX idx_sp_assigned ON sales_pipeline(assigned_to);
```

### `sales_activities`

```sql
CREATE TABLE sales_activities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id      UUID NOT NULL REFERENCES sales_pipeline(id) ON DELETE CASCADE,
  activity_type    TEXT NOT NULL,   -- call | email | demo | proposal | follow_up | contract | note
  summary          TEXT,            -- what happened
  outcome          TEXT,            -- positive | neutral | negative | no_answer
  next_action      TEXT,            -- what needs to happen next
  next_action_date DATE,
  duration_minutes INTEGER,         -- for calls and demos
  created_by       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sa_pipeline ON sales_activities(pipeline_id);
CREATE INDEX idx_sa_next_action_date ON sales_activities(next_action_date);
```

---

## Pipeline Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| **Win Rate** | Closed Won / (Closed Won + Closed Lost) | >40% |
| **Avg Sales Cycle** | Days from Lead to Closed Won | <21 days (Ess/Growth), <45 days (Perf/Ent) |
| **Avg Contract Value** | Avg MRR of Closed Won deals | >$700 MRR |
| **Demo-to-Proposal Rate** | Proposals sent / Demos delivered | >50% |
| **Proposal-to-Won Rate** | Closed Won / Proposals sent | >40% |
| **Weighted Pipeline MRR** | Sum(estimated_mrr × probability/100) | 3× monthly MRR target |
| **Stage Conversion Rate** | Exits to next stage / Entries | See targets below |

### Stage Conversion Targets

| Stage Transition | Target Conversion |
|-----------------|------------------|
| Lead → Qualified | >60% |
| Qualified → Discovery | >70% |
| Discovery → Demo | >80% |
| Demo → Proposal | >50% |
| Proposal → Won | >40% |
| Overall Lead → Won | >15% |

---

## Weighted Pipeline MRR Calculation

```sql
SELECT
  SUM(estimated_mrr * probability / 100.0) AS weighted_pipeline_mrr,
  SUM(estimated_mrr) AS total_pipeline_mrr,
  COUNT(*) AS open_deals,
  COUNT(*) FILTER (WHERE stage = 'demo') AS demos_in_flight,
  COUNT(*) FILTER (WHERE stage = 'proposal') AS proposals_out,
  AVG(CURRENT_DATE - created_at::date) AS avg_days_in_pipeline
FROM sales_pipeline
WHERE stage NOT IN ('closed_won', 'closed_lost');
```

---

## Sales Cycle Benchmarks

| Tier | Target Sales Cycle | Typical Stall Point |
|------|-------------------|---------------------|
| Essentials | 7–14 days | Proposal to decision (owner hesitation) |
| Growth | 14–21 days | Demo to proposal (tier fit questions) |
| Performance | 21–35 days | Discovery (ROI justification) |
| Enterprise | 30–45 days | Negotiation (contract review, DSO IT) |

---

## Function Signatures — `lib/commercialization/index.ts`

### `createPipelineEntry()`

```typescript
export async function createPipelineEntry(
  data: {
    organizationName: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    source?: PipelineSource;
    tierKey?: TierKey;
    billingType?: 'monthly' | 'annual';
    estimatedMrr?: number;
    closeDate?: Date;
    assignedTo?: string;
    notes?: string;
  }
): Promise<PipelineEntry>
```

### `updatePipelineStage()`

```typescript
export async function updatePipelineStage(
  id: string,
  stage: PipelineStage,
  options?: {
    notes?: string;
    lostReason?: string;
    estimatedMrr?: number;
    probability?: number;
  }
): Promise<PipelineEntry>
```

Automatically updates `stage_updated_at` and logs a `note` sales activity.

### `addSalesActivity()`

```typescript
export async function addSalesActivity(
  pipelineId: string,
  activity: {
    activityType: ActivityType;
    summary: string;
    outcome?: ActivityOutcome;
    nextAction?: string;
    nextActionDate?: Date;
    durationMinutes?: number;
    createdBy?: string;
  }
): Promise<SalesActivity>
```

### `getPipelineSummary()`

```typescript
export async function getPipelineSummary(
  filters?: {
    assignedTo?: string;
    stage?: PipelineStage;
    dateFrom?: Date;
    dateTo?: Date;
  }
): Promise<{
  totalEntries: number;
  weightedMrr: number;
  totalPipelineMrr: number;
  byStage: Record<PipelineStage, number>;
  avgSalesCycleDays: number;
  winRate: number;
  closedWonMtd: number;
}>
```

---

## Activity Follow-Up System

The `next_action_date` field in `sales_activities` feeds the sales team's daily task list:

```sql
-- Today's required follow-ups
SELECT
  sp.organization_name,
  sp.contact_name,
  sp.stage,
  sa.next_action,
  sa.next_action_date,
  sa.created_by
FROM sales_activities sa
JOIN sales_pipeline sp ON sp.id = sa.pipeline_id
WHERE sa.next_action_date = CURRENT_DATE
  AND sp.stage NOT IN ('closed_won', 'closed_lost')
ORDER BY sp.estimated_mrr DESC;
```

---

## Overdue Deal Alert

Deals that have not advanced in >7 days (Essentials/Growth) or >14 days (Performance/Enterprise) trigger a follow-up alert:

```sql
SELECT
  sp.organization_name,
  sp.stage,
  sp.estimated_mrr,
  sp.assigned_to,
  CURRENT_DATE - sp.stage_updated_at::date AS days_in_stage
FROM sales_pipeline sp
WHERE sp.stage NOT IN ('closed_won', 'closed_lost')
  AND (
    (sp.tier_key IN ('essentials', 'growth') AND CURRENT_DATE - sp.stage_updated_at::date > 7) OR
    (sp.tier_key IN ('performance', 'enterprise') AND CURRENT_DATE - sp.stage_updated_at::date > 14)
  )
ORDER BY days_in_stage DESC;
```

---

## Related Documentation

- `COMMERCIALIZATION_OS.md` — Overall commercialization model
- `DEMO_OS.md` — Demo script and objection handling
- `PRICING_OS.md` — Pricing matrix and tier definitions
- `PARTNER_OS.md` — Partner-sourced pipeline management
