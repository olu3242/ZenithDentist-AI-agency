# Zenith Patient OS — 2026 Product Roadmap

**Classification:** Canonical Roadmap Authority
**Status:** ACTIVE — Updated 2026-06-02
**Owner:** Zenith Platform Governance Board
**Horizon:** January 2026 – December 2026

---

## Roadmap Governing Principles

1. **Architecture is frozen.** No new modules without an ACR. The 2026 roadmap is about execution, not construction.
2. **Revenue validation comes before scale.** We do not add clients until revenue attribution is validated with real patient data.
3. **HIPAA compliance is non-negotiable.** No live PHI delivery until provider BAAs are signed.
4. **ALICE learns from real data.** The learning loop closes only when outcome reconciliation is live.
5. **Each quarter has a single primary objective.** Focus drives results.

---

## Q1 2026 (January – March): Foundation Complete

**Primary Objective:** Build the complete platform foundation — data layer, execution engine, intelligence layer.

**Status:** ✅ COMPLETE

### Deliverables

| Deliverable | Status | Evidence |
|-------------|--------|---------|
| Automation Platform operational (10 modules) | ✅ | lib/workflow-os — workflow-engine, registry, scheduler, step-executor |
| Event Fabric operational (immutable dual-write) | ✅ | lib/event-fabric |
| Digital Dentist Twin foundation | ✅ | lib/digital-dentist-twin, lib/avatar-studio, lib/voice-studio |
| Patient Influence Engine | ✅ | lib/patient-influence, lib/treatment-intelligence, lib/channel-optimization |
| Revenue engines (4 core engines) | ✅ | lib/revenue-engine — attribution, forecast, membership, recall |
| Communication Hub | ✅ | lib/communication-hub |
| Script Intelligence Engine | ✅ | lib/script-engine |
| Journey Library | ✅ | lib/journey-library |
| Patient Portal | ✅ | lib/patient-portal |
| n8n dependency eliminated for internal logic | ✅ | n8n score: 4/100 (external connectors only) |
| DB foundation (Phase 4-6 migrations) | ✅ | 202605210001-202605210003 |

**Q1 Gate:** All lib modules implemented, all migrations applied, all core API routes responding.
**Gate status:** PASSED ✅

---

## Q2 2026 (April – June): Intelligence + Integration

**Primary Objective:** AI intelligence layer fully operational; all external integrations built; Growth OS live.

**Status:** 🟡 SUBSTANTIALLY COMPLETE — 2 items remaining

### Deliverables

| Deliverable | Status | Target Date | Notes |
|-------------|--------|------------|-------|
| AI Agent OS — all 7 agents | ✅ | Apr 2026 | lib/agents — all agents registered |
| Integration OS core | ✅ | Apr 2026 | lib/integration-os |
| PMS adapters (OpenDental) | ✅ | Apr 2026 | lib/adapters/opendental-adapter.ts |
| Growth OS — Growth Score (7 dimensions) | ✅ | May 2026 | lib/growth-score, growth_scores table |
| Growth OS — 5 growth engines | ✅ | May 2026 | recall, referral, reputation, membership, new-patient |
| Practice Intelligence OS | ✅ | May 2026 | lib/practice-intelligence |
| Practice Memory Graph foundation | ✅ | May 2026 | lib/practice-memory |
| ALICE foundational decisions operational | ✅ | May 2026 | lib/alice/patient-decision-engine |
| **Live provider integration (Twilio, Resend)** | 🔴 | Jun 2026 | Env vars + credentials required |
| **First pilot client onboarded** | 🔴 | Jun 2026 | Depends on provider credentials + BAAs |

**Q2 Gate:** All adapters built; at least one communication provider live; first pilot client journey running.
**Gate status:** PARTIAL 🟡 — requires provider credential configuration.

**Q2 remaining actions (Jun 2026):**
1. Configure Twilio + Resend credentials
2. Sign provider BAAs (Twilio, Resend, Supabase minimum)
3. Run end-to-end journey test with real patient
4. Onboard first pilot client (supervised)

---

## Q3 2026 (July – September): Revenue Validation

**Primary Objective:** Prove that Zenith Patient OS generates measurable, attributable revenue for pilot clients.

**Status:** 🔴 UPCOMING

### Deliverables

| Deliverable | Target | Success Criteria |
|-------------|--------|----------------|
| Journey scheduler live (delay_days → execution-scheduler.ts) | Jul 2026 | Journey steps fire at correct intervals automatically |
| ALICE outcome reconciliation live | Jul 2026 | alice_patient_decisions linked to revenue_attribution_records |
| Revenue attribution validated with real patient data | Aug 2026 | ≥ 10 revenue events attributed to Zenith touchpoints |
| First 5 paying clients | Sep 2026 | 5 clients with active subscriptions |
| Case study published (first pilot client) | Sep 2026 | Documented revenue impact: production increase, recall recovery, treatment acceptance |
| Benchmark intelligence module | Sep 2026 | Cross-practice score comparisons enabled (requires ≥ 3 clients) |
| HeyGen/ElevenLabs live (video + voice) | Aug 2026 | Avatar video delivered in at least one journey |
| ALICE Executive Briefing delivered daily | Aug 2026 | Auto-generated briefing delivered to all pilot clients |
| Platform Certification re-run | Sep 2026 | Target: 90/100 (PLATINUM) |

**Q3 Gate:** ≥ 3 clients with validated revenue attribution, platform certification ≥ 90.

**Q3 KPIs:**
- Revenue attributed per client per month: target $5,000–$25,000 incremental production
- Treatment acceptance rate improvement: target +10 percentage points vs baseline
- Recall booking rate: target ≥ 20% of recall pipeline converts
- Membership enrollments driven by Zenith: target ≥ 5 per client per month
- Growth Score improvement: target +10 points vs onboarding baseline within 90 days

---

## Q4 2026 (October – December): Scale

**Primary Objective:** Scale from 5 to 25+ clients; advance ALICE cross-practice intelligence; expand platform ecosystem.

**Status:** 🔴 PLANNED

### Deliverables

| Deliverable | Target | Notes |
|-------------|--------|-------|
| DSO multi-practice rollout | Oct 2026 | Requires multi-org management UI + DSO-level reporting |
| Advanced ALICE (cross-practice learning) | Nov 2026 | ALICE learns patterns across practices to improve single-practice recommendations |
| Marketplace launch (3rd-party integrations) | Nov 2026 | Public integration registry; partner integrations (Dentrix, Eaglesoft, Carestream) |
| Mobile app — patient portal native | Nov 2026 | iOS + Android patient portal (React Native) |
| Voice agent — AI phone calls | Dec 2026 | AI voice agent for appointment reminders and recalls using ElevenLabs + voice twin |
| 25 paying clients | Dec 2026 | Scale milestone |
| SOC 2 Type II audit initiated | Oct 2026 | Pre-requisite for enterprise DSO clients |
| Multi-language support | Dec 2026 | Spanish as first additional language |
| Platform Certification: PLATINUM maintained | Ongoing | Score must remain ≥ 90 |

**Q4 Gate:** ≥ 25 clients, cross-practice ALICE operational, marketplace live.

---

## 2026 Annual KPIs

| Metric | Q1 Baseline | Q2 Target | Q3 Target | Q4 Target |
|--------|------------|----------|----------|----------|
| Clients onboarded | 0 | 1–2 (pilot) | 5 | 25 |
| Platform cert score | ~72 | 85 | 90 | 95 |
| Revenue attributed (per client/mo) | — | — | $5K–$25K | $10K–$50K |
| Growth Score avg (all clients) | — | — | 65+ | 75+ |
| Treatment acceptance lift (avg) | — | — | +5pp | +10pp |
| Recall recovery rate | — | — | 15%+ | 20%+ |
| ALICE fallback rate | — | < 30% | < 20% | < 10% |
| Platform uptime | — | 99% | 99.5% | 99.9% |

---

## Dependencies Between Quarters

```
Q1 Complete Foundation
    ↓
Q2 Integration + Intelligence live
    ↓ (requires: provider credentials + BAAs)
Q3 Revenue Validation with real patients
    ↓ (requires: ≥3 clients, validated attribution)
Q4 Scale
    ↓ (requires: 5 clients, cert ≥90, cross-practice data)
```

**If Q2 slips** (provider credentials delay), Q3 targets shift right by the same number of weeks. The critical path is: provider credentials → first client journey → revenue attribution validation.

---

## What Is NOT on the 2026 Roadmap

The following items are intentionally deferred to 2027 or later:

- Custom AI model training on approved Zenith platform data (requires >= 1,000 patients, 12-month data history)
- Autonomous ALICE execution without human confirmation (governance policy: ALICE recommends, humans approve)
- White-label platform licensing to other SaaS companies
- International expansion outside North America
- Acquisition or merger of complementary dental SaaS products
- Fully autonomous practice management (no front-desk required)

---

## Roadmap Change Process

All roadmap changes require:
1. Written proposal submitted to Platform Governance Board
2. Impact assessment on current quarter deliverables
3. Platform Certification impact analysis (does this change a frozen component?)
4. Approval from two board members if change affects Q2 or Q3
5. Updated roadmap committed to this document within 48 hours of approval
