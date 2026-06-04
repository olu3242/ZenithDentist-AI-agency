# Commercialization OS

## Overview

Commercialization OS is Zenith's operating model for how the platform sells, onboards, expands, and retains dental practice clients. It transforms a founder-led sales-and-onboarding process into a systematized, repeatable machine that can scale without the founder being personally involved in every deal.

**Goal:** Every step from prospect discovery through renewal and expansion is documented, tooled, and measurable.

---

## 9 Components of Commercialization OS

| # | Component | Description | Primary Document |
|---|-----------|-------------|-----------------|
| 1 | **Product Packaging** | 4-tier product structure with clear value differentiation | This document |
| 2 | **Pricing OS** | Pricing matrix, annual discounts, revenue metrics, upgrade triggers | `PRICING_OS.md` |
| 3 | **Sales OS** | 8-stage pipeline, CRM tables, conversion targets | `SALES_OS.md` |
| 4 | **Demo OS** | 30-minute demo script, objection handling, close framework | `DEMO_OS.md` |
| 5 | **Onboarding OS** | Standardized activation checklist, milestone gates, escalation | `ONBOARDING_OS.md` |
| 6 | **Partner OS** | 5 partner types, economics, registry, year-1 targets | `PARTNER_OS.md` |
| 7 | **Case Study OS** | Before/after metrics, automated extraction, publication assets | `CASE_STUDY_OS.md` |
| 8 | **Customer Success OS** | Health scoring, expansion plays, renewal framework | *(Customer Success Playbook)* |
| 9 | **Marketplace OS** | Content marketplace, partner developer program, revenue sharing | `MARKETPLACE_OS.md` |

---

## Product Tier Overview

| Tier | Monthly | Annual | Implementation | Providers | Locations |
|------|---------|--------|----------------|-----------|-----------|
| **Essentials** | $297 | $2,970 | $497 | 1–2 | 1 |
| **Growth** | $597 | $5,970 | $997 | 1–5 | 1 |
| **Performance** | $997 | $9,970 | $1,497 | 1–10 | 1 |
| **Enterprise** | $1,997 | $19,970 | $2,997 | Unlimited | Multi |

**Annual pricing = monthly × 10 (2 months free)**

### Tier Positioning

- **Essentials** — Solo dentist or associate practice. Core ALICE communications + basic recall. Entry point for pilot conversions.
- **Growth** — Growing practices (3–5 chair). Full ALICE + revenue attribution + membership campaign automation.
- **Performance** — Established practices wanting full Revenue OS including provider performance intelligence and practice benchmarking.
- **Enterprise** — Multi-location and DSO accounts. Full platform + marketplace + custom revenue forecasting + dedicated CSM.

---

## Database Layer

### `product_tiers` Table

```sql
CREATE TABLE product_tiers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_key          TEXT UNIQUE NOT NULL,     -- essentials | growth | performance | enterprise
  name              TEXT NOT NULL,
  monthly_price     NUMERIC(10,2) NOT NULL,
  annual_price      NUMERIC(10,2) NOT NULL,   -- monthly * 10
  implementation_fee NUMERIC(10,2) NOT NULL,
  max_providers     INTEGER,                  -- NULL = unlimited
  max_locations     INTEGER DEFAULT 1,
  features          JSONB NOT NULL DEFAULT '{}',
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Seeded data
INSERT INTO product_tiers (tier_key, name, monthly_price, annual_price, implementation_fee, max_providers, max_locations) VALUES
  ('essentials',   'Essentials',   297,  2970,  497,  2,    1),
  ('growth',       'Growth',       597,  5970,  997,  5,    1),
  ('performance',  'Performance',  997,  9970,  1497, 10,   1),
  ('enterprise',   'Enterprise',   1997, 19970, 2997, NULL, NULL);
```

### `sales_pipeline` Table (summary)

```sql
CREATE TABLE sales_pipeline (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  contact_name      TEXT,
  contact_email     TEXT,
  contact_phone     TEXT,
  stage             TEXT NOT NULL DEFAULT 'lead',
  tier_key          TEXT REFERENCES product_tiers(tier_key),
  estimated_mrr     NUMERIC(10,2),
  probability       INTEGER DEFAULT 5,
  close_date        DATE,
  assigned_to       TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### `sales_activities` Table (summary)

```sql
CREATE TABLE sales_activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id     UUID NOT NULL REFERENCES sales_pipeline(id),
  activity_type   TEXT NOT NULL,   -- call | email | demo | proposal | follow_up | note
  summary         TEXT,
  outcome         TEXT,
  next_action     TEXT,
  next_action_date DATE,
  created_by      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### `partner_registry` Table (summary)

```sql
CREATE TABLE partner_registry (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name    TEXT NOT NULL,
  partner_type    TEXT NOT NULL,   -- referral | reseller | implementation | strategic | technology
  contact_name    TEXT,
  contact_email   TEXT,
  status          TEXT DEFAULT 'active',
  commission_rate NUMERIC(5,2),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## `lib/commercialization/index.ts` — Function Reference

| Function | Signature | Description |
|----------|-----------|-------------|
| `createPipelineEntry` | `(data: NewPipelineEntry) => Promise<PipelineEntry>` | Add prospect to sales pipeline |
| `updatePipelineStage` | `(id: string, stage: PipelineStage, notes?: string) => Promise<PipelineEntry>` | Advance pipeline stage |
| `addSalesActivity` | `(pipelineId: string, activity: NewActivity) => Promise<SalesActivity>` | Log call, demo, email, etc. |
| `getPipelineSummary` | `(filters?: PipelineFilters) => Promise<PipelineSummary>` | Weighted pipeline MRR + stage counts |
| `getProductTiers` | `() => Promise<ProductTier[]>` | All active product tiers |
| `registerPartner` | `(data: NewPartner) => Promise<Partner>` | Add to partner_registry |
| `getPartners` | `(type?: PartnerType) => Promise<Partner[]>` | List partners, optionally filtered by type |

---

## API: `/api/commercialization`

| Method | Endpoint | Description | Auth Required |
|--------|---------|-------------|--------------|
| GET | `/api/commercialization` | Pipeline summary + KPIs | `super_admin` |
| POST | `/api/commercialization` | Create pipeline entry or register partner | `super_admin` |
| GET | `/api/commercialization/pipeline` | Full pipeline with activities | `super_admin` |
| GET | `/api/commercialization/tiers` | Product tier definitions | Public |
| POST | `/api/commercialization/partners` | Register new partner | `super_admin` |
| GET | `/api/commercialization/partners` | List partners | `super_admin` |

**Sample `GET /api/commercialization` response:**
```json
{
  "pipeline": {
    "totalEntries": 14,
    "weightedMrr": 8240,
    "byStage": {
      "lead": 4,
      "qualified": 3,
      "discovery": 2,
      "demo": 2,
      "proposal": 2,
      "negotiation": 1
    }
  },
  "mrr": 9450,
  "arr": 113400,
  "activeClients": 12,
  "newClientsThisMonth": 2
}
```

---

## Commercialization OS Metrics

The health of Commercialization OS is measured by:

| Metric | Target (Year 1 End) |
|--------|---------------------|
| MRR | $200,000 |
| Pipeline Coverage | 3× monthly MRR target |
| Demo-to-Close Rate | >40% |
| Avg Sales Cycle | <21 days (Essentials/Growth) |
| Onboarding Activation Rate | >80% live within 30 days |
| Net Revenue Retention | >110% |
| Partner Referrals (% of new pipeline) | >20% by Q4 |

---

## Founder-Independent Sales Vision

**Phase 1 (Current):** Founder-led sales using Sales OS + Demo OS as structured scripts.

**Phase 2 (Q3 2026):** SDR can run full demo cycle using Demo OS. CSM runs onboarding using Onboarding OS.

**Phase 3 (Q4 2026):** Reseller partners run their own sales cycles using Partner OS. Zenith earns MRR without direct involvement.

**Phase 4 (2027):** Self-serve trial activation for Essentials tier. Full product-led growth channel operational.

---

## Related Documentation

- `PRICING_OS.md` — Detailed pricing matrix and revenue metrics
- `SALES_OS.md` — Pipeline stages, tables, and conversion targets
- `DEMO_OS.md` — 30-minute demo script and objection handling
- `ONBOARDING_OS.md` — Activation checklist and milestone gates
- `PARTNER_OS.md` — Partner types, economics, and registry
- `CASE_STUDY_OS.md` — Evidence generation from client results
- `MARKETPLACE_OS.md` — Future marketplace and partner developer program
- `EXECUTIVE_KPI_FRAMEWORK.md` — Agency-level business performance tracking
