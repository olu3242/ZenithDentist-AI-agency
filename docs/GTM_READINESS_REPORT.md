# GTM Readiness Report

**Report Date:** 2026-05-30
**Scope:** Pricing, ROI story, customer journey, sales motion, GTM blockers

---

## 1. Pricing Tiers

### 1.1 Package Matrix (Source: `lib/offer-builder/packages.ts`)

| Package | Monthly Price | Annual Price (15% off) | Locations | Workflows |
|---|---|---|---|---|
| Starter | $497 | $422/mo ($5,064/yr) | 1 | 3 |
| Growth | $897 | $762/mo ($9,144/yr) | 3 | 5 |
| Scale | $1,497 | $1,272/mo ($15,264/yr) | 5 | 7 |
| Enterprise | Custom | Custom | Unlimited | All |

**Setup fee:** $497 flat for all paid packages (one-time).

**Enterprise price:** Currently `0` in the codebase — no pricing logic exists for Enterprise. A quote-based path must be implemented before Enterprise proposals can be generated with meaningful ROI multiples.

### 1.2 Workflow Coverage by Package

| Workflow | ID | Starter | Growth | Scale | Enterprise |
|---|---|---|---|---|---|
| Recall Recovery | `recall_due` | Yes | Yes | Yes | Yes |
| Review Generation | `review_request_due` | Yes | Yes | Yes | Yes |
| No-Show Recovery | `appointment_no_show` | Yes | Yes | Yes | Yes |
| Patient Reactivation | `reactivation_candidate_detected` | No | Yes | Yes | Yes |
| Missed Call Recovery | `missed_call_detected` | No | Yes | Yes | Yes |
| Treatment Follow-up | `treatment_followup` | No | No | Yes | Yes |
| Insurance Verification | `insurance_verification` | No | No | Yes | Yes |

### 1.3 Pricing Rationale

Each package is priced relative to the opportunity it unlocks. Using the scoring model's default constants:

- **Starter ($497)** targets practices with `totalScore < 40`. Expected monthly opportunity: $2,000–$5,000. At $497/mo, the practice needs to capture 10% of opportunity to break even. Day-90 ROI multiple typically 5–10x.

- **Growth ($897)** targets `totalScore 40–59`. Expected monthly opportunity: $5,000–$12,000. At $897/mo, Day-90 ROI multiple typically 8–14x. This is the volume package — widest addressable market in typical mid-size dental groups.

- **Scale ($1,497)** targets `totalScore 60–79`. Expected monthly opportunity: $12,000–$20,000. Adds treatment follow-up and insurance verification — the highest-margin automation categories after recall. Day-90 ROI multiple typically 10–15x.

- **Enterprise (custom)** targets multi-location DSOs and large groups. Value proposition shifts from per-workflow ROI to operational unification across locations.

---

## 2. The ROI Story

### 2.1 The 17.5x Headline

The 17.5x ROI figure used in GTM represents the Day-90 return for a high-opportunity Growth practice.

**Model inputs that produce 17.5x:**
```
monthlyRevenue   = $80,000
noShowRate       = 18%
chairCount       = 6
recallRate       = 40%
staffCount       = 6
avgRating        = 3.8
```

**Resulting computation:**
```
noShowOpportunity    = $80,000 × 0.18 × 0.60 = $8,640
recallOpportunity    = 6 × 4 × 0.60 × $150  = $2,160
laborSavings         = 6 × 8 × 22 × 0.15 × $22 = $3,485
reviewOpportunity    = 0.7 × 10 × $300       = $2,100
monthlyValue         = $16,385
roiMultiple (Day 90) = $16,385 / $897 = 18.3x
```

A more conservative 17.5x is defensible for this segment. The key input assumptions are:
- 18% no-show rate — above the 15% national average but common in practices without automated reminders
- 40% recall rate — below the 60% average for practices without a recall system
- $150 average visit value — conservative (actual averages range from $150–$350 depending on specialty)

### 2.2 Average-Practice ROI Expectations

For a practice near the industry midpoint:
```
monthlyRevenue = $60,000, noShowRate = 12%, chairCount = 5
recallRate = 55%, staffCount = 4, avgRating = 4.1
→ monthlyValue ≈ $8,000 → Growth ROI multiple ≈ 8.9x
```

GTM should quote 8–18x depending on practice profile, with 17.5x as the top-end reference.

### 2.3 ROI Proof Mechanism (vs Claim)

The ROI Proof Engine is designed to turn the ROI claim into a measurable proof delivered to the client monthly. The before-vs-after model captures:
- No-show rate reduction → dollar recovery
- Recall rate improvement → visit recovery at $150/visit
- Review count growth → new patient value at $300/patient
- Labor hours saved → at $22/hr

**Current gap:** The ROI Proof Engine has schema mismatches that prevent baseline capture and impact measurement from persisting data. Until these are fixed, ROI reports will be projections, not measurements. This is a significant GTM risk — the value proposition is "measurable ROI" but the measurement system doesn't function yet.

---

## 3. Customer Journey

### 3.1 Sales Motion (Designed)

```
Lead capture → Discovery call → Assessment intake → Opportunity score →
Package recommendation → Proposal generation → Stripe checkout →
Onboarding (Week 1) → Activation (Week 2–3) → Optimization (Day 30+) →
Monthly ROI report → Quarterly QBR → Renewal / Expansion
```

### 3.2 Discovery Phase

**Tool:** Discovery OS — `createDiscoverySession()` with 11 input fields.

**Sales rep collects:**
- Practice name and PMS system
- Chair count, provider count, staff count
- Monthly revenue
- No-show rate, recall rate, treatment acceptance rate
- Review count and average rating

**Output:** Opportunity score (0–100), recommended package, dollar opportunity by category.

**Current gap:** No UI exists for the intake form. Sales reps cannot currently run a live Discovery OS assessment — they would need to call the API directly or use a backend script.

### 3.3 Proposal Phase

**Tool:** Offer Builder — `generateProposal()` with package key and opportunity score.

**Output:** Full proposal document with:
- Executive summary referencing specific dollar opportunity
- Scope items matching the package tier
- 3-phase timeline
- Pricing with annual discount option
- Day-30/60/90 ROI projections

**Current gap:** No proposal PDF generation or email delivery. The `ProposalDocument` is a TypeScript object stored in Supabase — there is no rendering layer to send to the prospect.

### 3.4 Activation Phase

**Week 1:** PMS integration, workflow configuration, staff training
**Week 2–3:** Go-live on recall, no-show, and review workflows

**Integration readiness at activation:**
- Resend (email): LIVE — recall, review, and no-show email campaigns can run
- Twilio (SMS): DISCONNECTED — SMS workflows cannot run
- OpenDental: MOCKED — patient data must be manually imported or the mock removed
- Calendly: PARTIAL — booking confirmation partial
- Stripe: PARTIAL (webhook only) — subscription billing needs full setup

**Practical activation capability:** Email-only automation is ready. SMS-dependent workflows (recall reminders, missed call recovery) will not function at launch.

### 3.5 ROI Reporting Phase

**Monthly:** `generateMonthlyImpactReport()` — narrative + key metrics
**Quarterly:** `generateQuarterlyReport()` — narrative + top wins bullets
**Annual:** `generateAnnualValueReport()` — annualized ROI narrative

**Delivery mechanism:** None exists. Reports are generated as TypeScript objects and not persisted or emailed. A report delivery mechanism (email via Resend, PDF generation, portal display) is needed before reporting phase is operational.

---

## 4. Sales Intelligence (Mission Control)

The Sales Intelligence Center (`lib/mission-control/sales-intelligence-center.ts`) surfaces:
- Discovery funnel: sessions → qualified → proposals → closed
- Opportunity buckets: high/medium/low
- Total pipeline value and weighted forecast (from Revenue OS pipeline engine)
- Average opportunity score (stage-weighted proxy)

This provides internal pipeline visibility but relies on the pipeline engine (`lib/revenue-os/pipeline-engine`) having active deal data. If no deals are tracked there, all values will be zero.

---

## 5. GTM Blockers

### Hard Blockers (must fix before first revenue)

**B1: Discovery OS schema mismatch**
- Impact: Sales reps cannot save assessments; no opportunity data persists
- Fix: Align `discovery-session.ts` insert fields with migration columns, or run a new migration adding named columns
- Effort: 2–4 hours for migration, 1 day for module alignment

**B2: ROI Proof Engine schema mismatches (2)**
- Impact: Baseline capture and impact measurement fail silently; no ROI proof is generated
- Fix: New migration adding `monthly_revenue`, `no_show_rate` etc. to `automation_baselines`; align `impact_measurements` insert fields
- Effort: 1 day

**B3: No proposal delivery mechanism**
- Impact: Proposals exist as database records but cannot be sent to prospects
- Fix: Add PDF rendering (react-pdf or Puppeteer) or build a shareable proposal URL
- Effort: 2–5 days

**B4: OpenDental MOCKED**
- Impact: Patient recall and reactivation workflows run on synthetic data
- Fix: Unblock OpenDental API integration or provide CSV import path
- Effort: Unknown (depends on OpenDental API availability)

**B5: Platform cost hardcoded in ROI Engine**
- Impact: Starter and Scale customers see incorrect ROI multiples; Enterprise shows 0x
- Fix: Read active subscription from Stripe or a subscriptions table
- Effort: 1–2 days

### Soft Blockers (must fix before scale)

**B6: No authentication layer**
- Impact: All customers share a single portal token; cannot safely onboard multiple clients
- Fix: Implement Supabase Auth (2–5 days)

**B7: Twilio DISCONNECTED**
- Impact: SMS-based recall reminders, missed call recovery, and reactivation sequences cannot run; email-only coverage
- Fix: Wire Twilio credentials and enable SMS queue handler
- Effort: 3–5 days

**B8: No discovery intake UI**
- Impact: Sales reps must call API manually to run opportunity assessments
- Fix: Build a sales rep-facing assessment form route
- Effort: 1–2 days

**B9: No ROI report delivery**
- Impact: Monthly/quarterly/annual reports are generated in-memory but never delivered
- Fix: Email delivery via Resend + portal display route
- Effort: 2–3 days

**B10: Enterprise pricing not implemented**
- Impact: Cannot generate valid Enterprise proposals
- Fix: Add price parameter to Enterprise proposal path
- Effort: 4 hours

---

## 6. GTM Readiness by Segment

| Segment | Price | Channels Ready | Data Ready | Reporting Ready | Overall |
|---|---|---|---|---|---|
| Single-location Starter | $497/mo | Email only | Partial | No | 50% |
| Multi-location Growth | $897/mo | Email only | Partial | No | 45% |
| Scale (7 workflows) | $1,497/mo | Email only | Partial | No | 40% |
| Enterprise DSO | Custom | Email only | Not ready | No | 20% |

### Realistic First-Customer Profile

The safest first-customer scenario is:
- Single-location dental practice
- Growth package at $897/mo
- Email-only automation (recall + review + no-show)
- Manual data import (bypassing OpenDental mock)
- Manual ROI reporting (spreadsheet until engine is fixed)

This is GTM-viable within 2–3 weeks of schema fixes and one manual process per customer.

---

## 7. Revenue Projections (Tool-Generated, Not Business Projections)

The following are mechanical outputs of the scoring model at different pipeline stages. They are not business forecasts.

**5 Growth customers:** $897 × 5 = $4,485/mo ($53,820/yr ARR)
- Combined monthly opportunity delivered: ~$45,000
- Average customer ROI: ~10x

**20 customers (mix):**
- 10 Growth ($897) + 7 Scale ($1,497) + 3 Starter ($497) = $22,932/mo (~$275k ARR)
- Average customer ROI: ~9x

**50 customers (scale):**
- Mix shifts toward Growth/Scale as DSO referrals come in
- ~$650k–$800k ARR with current package pricing

These projections are consistent with the $897 × ROI model. The 17.5x headline justifies premium positioning in the market relative to generic automation tools that do not show ROI proof.

---

## 8. Competitive Positioning Context

The ROI Proof Engine is the primary differentiator. Competitors in dental automation (Lighthouse 360, RevenueWell, Solutionreach) provide automation but do not show before-vs-after dollar proof. The ability to say "your no-show rate dropped from 15% to 9% — that's $X recovered" is what justifies the price premium and supports renewals.

This differentiator only exists if the ROI Proof Engine is fixed and generating real measurements. Until then, the competitive story is based on claimed ROI, not proven ROI — which is the same as every competitor.

**GTM priority sequence:**
1. Fix schema mismatches (makes the proof engine functional)
2. Connect OpenDental or provide import (gives real patient data)
3. Build report delivery (makes ROI visible to customers)
4. Connect Twilio (unlocks SMS, expands automation coverage)
5. Implement auth (enables safe multi-tenant scale)
