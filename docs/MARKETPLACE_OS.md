# Marketplace OS

## Overview

Marketplace OS defines the strategy, architecture, and roadmap for the Zenith Content Marketplace — a platform where dental practices discover and install journeys, scripts, agent packs, integrations, and industry content packs. Phase 1 is internal-only (Zenith-produced content). Phase 2 opens to certified external partners.

---

## Phase Roadmap

| Phase | Timeline | Access | Description |
|-------|----------|--------|-------------|
| **Phase 1** | Current (2026) | Internal only | Zenith-curated journeys, scripts, and agent configurations |
| **Phase 2** | Q1 2027 | Certified partners | Vetted partner publishers with reviewed content |
| **Phase 3** | Q3 2027 | Open marketplace | Broader developer ecosystem with governance layer |

---

## Phase 1: Internal Marketplace (Current)

All marketplace content in Phase 1 is produced and maintained by the Zenith team:

- Journey packs by specialty (orthodontics, pediatric, cosmetic, general)
- Script collections by scenario (treatment consultation, insurance objection, recall re-engagement)
- Agent packs (pre-configured ALICE behavior sets for specific practice types)
- Integration connectors (Zenith-built PMS and third-party connections)

**Phase 1 content access:**
- All tiers can browse the marketplace.
- Installation available on **Enterprise tier only** (Phase 1).
- Growth/Performance tiers access curated starter packs during onboarding.

---

## 5 Marketplace Categories

### 1. Journey Packs

Pre-built multi-step patient journeys configured for specific dental specialties or scenarios.

| Pack Name | Specialty | Steps | Use Case |
|-----------|----------|-------|---------|
| Ortho Follow-Up Pack | Orthodontics | 5-step | Treatment plan acceptance for braces/aligners |
| Pediatric Welcome Pack | Pediatric | 3-step | First-visit anxiety reduction + parent engagement |
| Cosmetic Conversion Pack | Cosmetic | 4-step | Whitening/veneers upsell journey |
| Implant Education Pack | Oral Surgery | 5-step | Implant patient education + acceptance |
| General Recall Pack | General | 3-step | Standard 6-month recall with avatar video |

**Journey Pack schema:**
```json
{
  "packId": "ortho-followup-v1",
  "name": "Ortho Follow-Up Pack",
  "category": "journey_pack",
  "specialty": "orthodontics",
  "steps": [...],
  "triggers": [...],
  "publisher": "zenith",
  "version": "1.0.0",
  "price": 0,
  "enterpriseOnly": false
}
```

### 2. Script Collections

Library of avatar video scripts organized by patient scenario. Each script is 60–120 seconds, optimized for the provider avatar delivery format.

| Collection | Scripts Included | Purpose |
|-----------|-----------------|---------|
| Treatment Acceptance Scripts | 8 scripts | Post-consultation follow-up |
| Recall Re-Engagement Scripts | 5 scripts | Overdue recall patients |
| Membership Pitch Scripts | 4 scripts | Uninsured patient conversion |
| Review Request Scripts | 3 scripts | Post-appointment review ask |
| Welcome Scripts | 3 scripts | New patient first impression |

### 3. Agent Packs

Pre-configured ALICE behavior sets that tune recommendation thresholds, channel preferences, and journey triggers for specific practice profiles.

| Pack Name | Profile | Description |
|-----------|---------|-------------|
| Solo Practitioner Pack | 1 provider, <500 patients | Lean ALICE config, essentials-focused |
| High-Volume General Pack | 2–5 providers, 1,000+ patients | Aggressive recall + review automation |
| Specialty Focus Pack | Specialty practices | Priority on treatment acceptance over recall |
| Concierge Practice Pack | Premium boutique practices | White-glove journey tone, reduced frequency |

### 4. Integration Connectors

Software integrations that extend Zenith's data layer.

| Connector | Status | Tier Required |
|-----------|--------|--------------|
| OpenDental (ODBC) | Live | All tiers |
| OpenDental API | Live | Growth+ |
| Twilio SMS/Voice | Live | All tiers |
| Resend Email | Live | All tiers |
| Google Business Profile | Beta | Growth+ |
| **CareStack** | Roadmap Q3 2026 | Enterprise |
| **Curve Dental** | Roadmap Q4 2026 | Enterprise |
| **Eaglesoft** | Roadmap Q1 2027 | Enterprise |
| **Dentrix Enterprise** | Roadmap Q2 2027 | Enterprise |
| **Stripe (payments)** | Roadmap Q2 2026 | Growth+ |

### 5. Industry Packs

Bundled content sets for specific geographic or demographic markets.

| Pack Name | Market | Contents |
|-----------|--------|---------|
| Spanish-Language Pack | Hispanic communities | Spanish scripts + journey translations |
| Senior Patient Pack | 60+ demographics | Simplified messaging, voice-first delivery |
| Military/VA Pack | Military families | Benefits-aware messaging, VA insurance handling |

---

## Existing Marketplace Framework

The `marketplace-core/` module provides the infrastructure for Phase 1:

| Module | Description |
|--------|-------------|
| `extension_registry` | Catalog of all marketplace items with metadata, version, publisher |
| `extension_loader` | Installs/activates marketplace items into an organization's config |
| `extension_governance` | Approval workflow for partner-submitted items (Phase 2) |

```typescript
// extension_registry — item record shape
interface MarketplaceItem {
  id: string;
  itemKey: string;           // e.g. 'ortho-followup-v1'
  category: MarketplaceCategory;
  name: string;
  description: string;
  publisher: string;         // 'zenith' | partner_id
  version: string;
  price: number;             // 0 for included items, > 0 for paid
  enterpriseOnly: boolean;
  approvalStatus: 'approved' | 'pending' | 'rejected';
  installCount: number;
  rating: number | null;
  publishedAt: Date;
}
```

---

## Revenue Model

| Scenario | Revenue Share |
|----------|--------------|
| Zenith-published items (free) | N/A — included in subscription value |
| Zenith-published paid items | 100% to Zenith |
| Partner-published items (Phase 2) | 70% to partner, 30% platform commission |
| Enterprise custom marketplace packs | Negotiated |

**Phase 2 projection:**
- 10 certified partner publishers each offering 2–4 items at $97–$297/item
- Average Zenith revenue: 30% of $5,000–$15,000 gross monthly marketplace volume = $1,500–$4,500/month additional revenue

---

## Enterprise Marketplace Access

Enterprise tier includes:
- Full marketplace browsing and one-click installation.
- Access to all Phase 1 curated content at no additional cost.
- Ability to request custom packs from the Zenith team.
- Phase 2: priority access to partner-published items before general availability.

Non-Enterprise tiers receive:
- Starter pack during onboarding (curated for their practice type).
- Ability to browse the catalog (installation locked to Enterprise in Phase 1).

---

## Partner Developer Program (Phase 2)

To publish marketplace items as a partner:

1. **Apply** — via partner portal (Q3 2027); requires existing partner status in `partner_registry`.
2. **Build** — use Zenith Marketplace SDK (documentation to be released Q2 2027).
3. **Submit** — item submitted for governance review via `extension_governance`.
4. **Review** — Zenith team reviews within 14 business days: content quality, safety, compliance.
5. **Publish** — approved items listed on marketplace with partner attribution.
6. **Earn** — 70% of revenue, paid monthly via Stripe Connect.

**Governance criteria for partner items:**
- No patient data access beyond what the organization already permits.
- Scripts reviewed for HIPAA-compliant language.
- Journeys tested for deliverability (SMS/email compliance).
- No competing products embedded or promoted within pack content.

---

## Integration Connector Roadmap Detail

| PMS | Market Share (dental) | Integration Approach | Target Quarter |
|-----|-----------------------|---------------------|---------------|
| CareStack | 15% | REST API | Q3 2026 |
| Curve Dental | 10% | REST API | Q4 2026 |
| Eaglesoft | 20% | ODBC + file export | Q1 2027 |
| Dentrix Enterprise | 25% | REST API (Open API) | Q2 2027 |

Eaglesoft integration uses file-export approach (CSV nightly) due to limited API availability. All others use REST API.

---

## Marketplace Analytics (Internal)

```sql
-- Top installed marketplace items
SELECT
  mi.name,
  mi.category,
  mi.publisher,
  COUNT(DISTINCT oi.organization_id) AS install_count,
  AVG(oi.satisfaction_rating) AS avg_rating
FROM marketplace_installs oi
JOIN marketplace_items mi ON mi.id = oi.item_id
GROUP BY mi.id, mi.name, mi.category, mi.publisher
ORDER BY install_count DESC
LIMIT 20;
```

---

## Related Documentation

- `COMMERCIALIZATION_OS.md` — Marketplace as one of the 9 commercialization components
- `PARTNER_OS.md` — Partner types including Technology Partners who publish integrations
- `PRICING_OS.md` — Enterprise tier requirement for marketplace installation
