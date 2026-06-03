# Partner OS

## Overview

Partner OS defines Zenith's partner program: the five partner types, economic model, qualification criteria, database schema, and Year 1 targets. Partners are a key lever for achieving founder-independent revenue growth.

---

## 5 Partner Types

| # | Type | Key | Description |
|---|------|-----|-------------|
| 1 | **Referral** | `referral` | Refers prospects; earns one-time or recurring commission |
| 2 | **Reseller** | `reseller` | Sells Zenith independently under their brand or co-brand |
| 3 | **Implementation** | `implementation` | Delivers onboarding and setup services to Zenith clients |
| 4 | **Strategic** | `strategic` | Deep integration, co-marketing, or joint GTM partnership |
| 5 | **Technology** | `technology` | Software integration partner (PMS vendors, payment processors, etc.) |

---

## Partner Economics

| Partner Type | Commission Structure | Payment Timing |
|-------------|---------------------|---------------|
| **Referral** | 10% of first-year MRR per referred client | Monthly for 12 months |
| **Reseller** | 20% ongoing MRR per managed client | Monthly, ongoing |
| **Implementation** | $500–$2,000 per deployment (based on tier) | At onboarding completion |
| **Strategic** | Custom — negotiated per agreement | Per contract terms |
| **Technology** | Co-marketing, no direct commission — revenue share on joint clients | Per contract terms |

### Implementation Partner Fee Schedule

| Client Tier | Implementation Partner Fee |
|-------------|--------------------------|
| Essentials | $500 per deployment |
| Growth | $750 per deployment |
| Performance | $1,200 per deployment |
| Enterprise | $2,000 per deployment |

### Referral Partner Example (Year 1)

- Partner refers 5 Growth clients ($597/mo each)
- Year 1 commissions: 5 × $597 × 10% × 12 = $3,582
- Year 2 (no commission after 12 months): referral partner has incentive to refer more

---

## Database Schema: `partner_registry`

```sql
CREATE TABLE partner_registry (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name            TEXT NOT NULL,
  partner_type            TEXT NOT NULL,        -- referral | reseller | implementation | strategic | technology
  contact_name            TEXT,
  contact_email           TEXT,
  contact_phone           TEXT,
  website                 TEXT,
  region                  TEXT,                 -- geographic focus
  status                  TEXT NOT NULL DEFAULT 'active',  -- active | inactive | pending | churned
  commission_rate         NUMERIC(5,2),         -- % override (NULL = default for type)
  tier_focus              TEXT[],               -- ['growth', 'performance'] — tiers they sell
  referrals_sent          INTEGER DEFAULT 0,
  referrals_converted     INTEGER DEFAULT 0,
  total_revenue_generated NUMERIC(12,2) DEFAULT 0,
  notes                   TEXT,
  joined_at               DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pr_type ON partner_registry(partner_type);
CREATE INDEX idx_pr_status ON partner_registry(status);
```

---

## Qualification Criteria

### Referral Partner
- Has existing relationships with dental practice owners or office managers
- Dental industry adjacency (dental supply rep, consultant, accountant, insurance broker)
- Willing to attend 1-hour Zenith product briefing
- No minimum referral commitment

### Reseller Partner
- Minimum 3 existing dental practice clients they actively manage
- Demonstrated ability to sell software/SaaS to dental practices
- Completes Zenith Reseller Certification (4-hour training + demo certification)
- Commits to minimum 2 new clients per quarter

### Implementation Partner
- Technical background (IT consultant, dental practice management consultant)
- OpenDental configuration experience preferred
- Completes Zenith Technical Certification (8-hour training + hands-on setup)
- Carries professional liability insurance

### Strategic Partner
- Organization with meaningful reach to dental practice decision-makers (DSO, dental association, distributor)
- C-level sponsor willing to co-brand or co-market
- Negotiated on case-by-case basis

### Technology Partner
- Established software product serving dental practices
- API capability for integration
- Aligned user base (non-competing)
- Engineering team available for integration build

---

## Function Signatures

### `registerPartner()`

```typescript
export async function registerPartner(
  data: {
    partnerName: string;
    partnerType: PartnerType;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    region?: string;
    commissionRate?: number;    // overrides default if provided
    tierFocus?: TierKey[];
    notes?: string;
  }
): Promise<Partner>
```

### `getPartners()`

```typescript
export async function getPartners(
  filters?: {
    type?: PartnerType;
    status?: PartnerStatus;
    region?: string;
  }
): Promise<Partner[]>
```

**Response shape:**

```typescript
interface Partner {
  id: string;
  partnerName: string;
  partnerType: PartnerType;
  contactName: string | null;
  contactEmail: string | null;
  status: PartnerStatus;
  commissionRate: number;
  referralsSent: number;
  referralsConverted: number;
  conversionRate: number;       // referrals_converted / referrals_sent
  totalRevenueGenerated: number;
  joinedAt: string;
}
```

---

## Partner Success Metrics

| Metric | Description | Target (Year 1 End) |
|--------|-------------|---------------------|
| `referrals_sent` | Total prospects referred by partner | 3+ per referral partner |
| `referrals_converted` | Prospects that became Zenith clients | >30% conversion rate |
| `conversion_rate` | `referrals_converted / referrals_sent` | >30% |
| `total_revenue_generated` | Total MRR attributed to partner referrals | $2,000+/partner/year |
| Active partner count | Partners with at least 1 referral in last 90 days | 5 referral, 2 reseller |

**Partner performance SQL:**

```sql
SELECT
  pr.partner_name,
  pr.partner_type,
  pr.referrals_sent,
  pr.referrals_converted,
  ROUND(100.0 * pr.referrals_converted / NULLIF(pr.referrals_sent, 0), 1) AS conversion_rate,
  pr.total_revenue_generated,
  ROUND(pr.total_revenue_generated / NULLIF(pr.referrals_converted, 0), 2) AS avg_revenue_per_conversion
FROM partner_registry pr
WHERE pr.status = 'active'
ORDER BY pr.total_revenue_generated DESC;
```

---

## Year 1 Partner Targets

| Quarter | Referral Partners | Resellers | Implementation Partners | Total Partner Pipeline MRR |
|---------|:-----------------:|:---------:|:----------------------:|---------------------------|
| Q1 2026 | 1 | 0 | 0 | $300 |
| Q2 2026 | 3 | 1 | 1 | $1,200 |
| Q3 2026 | 5 | 1 | 2 | $3,000 |
| Q4 2026 | 5 | 2 | 3 | $6,000+ |

**Year 1 goal:** 5 active referral partners + 2 active resellers generating >20% of new client pipeline.

---

## Partner Attribution in Sales Pipeline

When a prospect is partner-referred, the `sales_pipeline` record is tagged:

```sql
-- Tag partner referral in pipeline
UPDATE sales_pipeline SET
  source = 'partner',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{partner_id}',
    to_jsonb($1::text)   -- partner_registry.id
  )
WHERE id = $2;

-- Credit partner on conversion
UPDATE partner_registry SET
  referrals_converted = referrals_converted + 1,
  total_revenue_generated = total_revenue_generated + $1  -- monthly commission amount
WHERE id = $2;
```

---

## Future: Partner Portal (Roadmap)

| Feature | Target |
|---------|--------|
| Partner self-service referral link | Q3 2026 |
| Partner pipeline dashboard (see referred clients) | Q4 2026 |
| Commission tracking + payout history | Q4 2026 |
| Reseller white-label option | Q1 2027 |
| Partner developer portal (for marketplace publishing) | Q3 2027 |

---

## Related Documentation

- `COMMERCIALIZATION_OS.md` — Partner OS as one of the 9 commercialization components
- `SALES_OS.md` — How partner-referred leads enter the sales pipeline
- `MARKETPLACE_OS.md` — Technology partners and future marketplace developer program
