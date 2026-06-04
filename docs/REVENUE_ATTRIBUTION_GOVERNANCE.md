# Revenue Attribution Governance

**Document Type:** Canonical Governance Reference
**Platform:** Zenith Patient OS™
**Last Updated:** 2026-06-02
**Status:** ACTIVE — governs all revenue attribution claims

---

## 1. Governing Principle

> **Every revenue claim must be traceable to a specific touchpoint.**

Revenue attribution is the mechanism by which the Zenith Patient OS™ demonstrates financial value to practices. Because these numbers directly influence subscription renewals, upsells, and ROI conversations, attribution must be conservative, traceable, and auditable.

Overclaiming revenue attribution — attributing revenue without a verifiable causal link — is a platform integrity violation. The platform's long-term credibility depends on accurate attribution.

---

## 2. Attribution Confidence Levels

Attribution confidence is determined by the time elapsed between the platform touchpoint and the patient action that generated revenue:

| Level | Score | Definition | Time Window |
|---|---|---|---|
| `direct` | 0.9 | Patient acted after platform touchpoint within short window | Within 24 hours |
| `assisted` | 0.7 | Patient acted after platform touchpoint within medium window | Within 7 days |
| `influenced` | 0.5 | Patient acted after platform touchpoint within broad window | Within 30 days |
| `inferred` | 0.3 | Correlation only — no direct causal chain documented | Within 90 days |

### Confidence Level Usage Rules

- **Financial projections:** Use only `direct` + `assisted` (≥ 0.7) — conservative, defensible
- **Marketing claims:** May include `influenced` (≥ 0.5) with clear disclosure of methodology
- **Research analysis:** May include `inferred` (0.3) with statistical methodology documentation
- **Dispute adjudication:** Defaults to `direct` only unless additional evidence provided

---

## 3. Required Fields on Every Attribution Record

Every row in `revenue_attribution_records` must include all of the following:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `uuid` | YES | Attribution record identifier |
| `touchpoint_type` | `enum` | YES | One of the four attribution engines |
| `touchpoint_id` | `uuid` | YES | Foreign key to the specific touchpoint record |
| `patient_external_id` | `string` | YES | Opaque PMS reference — no PHI |
| `organization_id` | `uuid` | YES | Tenant context |
| `attributed_revenue` | `decimal(10,2)` | YES | Dollar amount attributed |
| `attribution_confidence` | `decimal(3,2)` | YES | 0.3, 0.5, 0.7, or 0.9 |
| `attribution_date` | `date` | YES | Date attribution was recorded |
| `revenue_event_date` | `date` | YES | Date the revenue-generating event occurred |
| `attribution_method` | `string` | YES | Which engine/algorithm calculated this |
| `created_at` | `timestamptz` | YES | Record creation timestamp |
| `disputed` | `boolean` | NO | Flagged by organization_owner as disputed |
| `disputed_at` | `timestamptz` | NO | When dispute was raised |
| `dispute_resolved_by` | `uuid` | NO | super_admin who resolved the dispute |

---

## 4. Four Attribution Engines

All `touchpoint_type` values must be one of these four canonical attribution engines:

### 4.1 no_show_prevention
- **What it measures:** Revenue from appointments that would have been lost to no-shows but were kept due to platform outreach
- **Touchpoint:** A no-show prevention communication sent by the platform
- **Revenue calculation:** Average appointment value × (reduction in no-show rate) × attribution confidence
- **Minimum confidence required:** `assisted` (0.7) — patient kept appointment within 7 days of receiving outreach

### 4.2 treatment_acceptance
- **What it measures:** Revenue from treatment plans that were accepted after platform-influenced patient engagement
- **Touchpoint:** ALICE recommendation or Digital Dentist Twin™ treatment explanation video
- **Revenue calculation:** Treatment plan value × attribution confidence
- **Minimum confidence required:** `direct` (0.9) — patient accepted treatment within 24h of video/recommendation

### 4.3 referral_growth
- **What it measures:** Revenue from new patients referred by existing patients after platform referral ask
- **Touchpoint:** Referral ask communication with unique referral link
- **Revenue calculation:** New patient lifetime value estimate × attribution confidence
- **Minimum confidence required:** `direct` (0.9) — referral link used within 24h of referral ask

### 4.4 chair_fill
- **What it measures:** Revenue from previously empty appointment slots filled by platform recall campaigns
- **Touchpoint:** Recall outreach communication (30-day or 90-day)
- **Revenue calculation:** Appointment value for filled slot × attribution confidence
- **Minimum confidence required:** `assisted` (0.7) — patient booked within 7 days of recall outreach

---

## 5. Multi-Touch Attribution

A single patient journey may pass through multiple platform touchpoints before generating revenue. Governance rules for multi-touch scenarios:

1. **Multiple attribution records are permitted** — one per touchpoint that meets the confidence threshold
2. **Revenue cap rule:** The sum of all attributed revenue for a single patient revenue event must not exceed the actual revenue amount
3. **Priority ordering:** When attribution records would sum to > actual revenue, prioritize by confidence level (highest confidence gets full attribution; lower confidence records are pro-rated)
4. **Temporal ordering:** The touchpoint closest in time to the revenue event receives primary attribution weight
5. **Cross-engine cap:** A single revenue event may not be attributed to more than two engines simultaneously

---

## 6. Prohibited Attribution Claims

The following attribution claims are explicitly prohibited and must be blocked at the service layer:

| Prohibited Pattern | Reason |
|---|---|
| Revenue attributed without a `touchpoint_id` foreign key | No traceable causal link |
| Revenue attributed to ALICE without a linked `alice_patient_decisions` record | ALICE attribution requires decision audit trail |
| Retrospective attribution more than 90 days back | Beyond `inferred` confidence window |
| Attribution confidence outside {0.3, 0.5, 0.7, 0.9} | Only canonical confidence levels allowed |
| `attributed_revenue` greater than actual revenue event value | Overclaiming |
| Attribution to an inactive `touchpoint_id` | Touchpoint must be a valid, completed event |
| Attribution without `organization_id` | Violates tenant isolation |
| Attributing the same revenue event to the same engine twice | Double-counting |

---

## 7. Dispute Resolution Process

Practices may dispute attribution records they believe are incorrect.

### Dispute Initiation
- Role: `organization_owner` or above
- Action: Flag `revenue_attribution_records.disputed = true` via Revenue Command Center
- Required: Written reason for dispute (stored in `dispute_reason` field)
- Timeline: Must be raised within 90 days of attribution record creation

### Dispute Review
- Role: `super_admin` only
- Process:
  1. Review `touchpoint_id` to confirm touchpoint record exists
  2. Review time delta between touchpoint and revenue event
  3. Review `attribution_confidence` is correctly categorized
  4. Determine: uphold attribution, downgrade confidence level, or remove record
- Timeline: Resolution within 10 business days

### Dispute Outcomes
| Outcome | Action |
|---|---|
| Upheld | `disputed` flag cleared, `dispute_resolution_note` added |
| Confidence adjusted | New attribution record created at lower confidence; original retained with `superseded = true` |
| Attribution removed | Record soft-deleted (is_voided = true); revenue_total recalculated |

---

## 8. Audit Requirements

### Monthly Attribution Snapshot
- A monthly summary record must be inserted into `revenue_attribution_records` with `attribution_method = 'monthly_summary'`
- Includes: total attributed revenue by engine, by confidence level, by touchpoint type
- Created automatically by a scheduled workflow on the last day of each month
- Immutable once created — corrections require a new record, not an update

### Audit Log Requirements
- Every `revenue_attribution_records` INSERT generates an `AUDIT_EVENT` in the Event Fabric
- Every dispute action generates an `AUDIT_EVENT`
- Every monthly snapshot generation is logged
- Retention: attribution audit logs retained 7 years (HIPAA financial record requirement)

---

## 9. Revenue Command Center

The Revenue Command Center displays attribution data with the following views:

| View | Description | Data Source |
|---|---|---|
| Attribution by touchpoint type | Revenue breakdown per engine (no_show_prevention, treatment_acceptance, referral_growth, chair_fill) | `revenue_attribution_records` GROUP BY touchpoint_type |
| Attribution by engine | Same as above — alternative grouping | `revenue_attribution_records` |
| Attribution by confidence level | Split between direct, assisted, influenced, inferred | GROUP BY attribution_confidence |
| Monthly trend | 12-month rolling attribution chart | Monthly summary records |
| Disputed records | Open disputes awaiting review | WHERE disputed = true |
| ALICE-attributed revenue | Revenue linked to ALICE decisions | JOIN alice_patient_decisions |

**Display rule:** Default display shows `direct + assisted` (≥ 0.7) only. A toggle allows viewing all confidence levels with clear labeling.

---

## 10. Financial Reporting Standards

When revenue attribution figures are used in financial projections, investor reporting, or client ROI reports:

| Use Case | Allowed Confidence Levels | Notes |
|---|---|---|
| Financial projections | direct + assisted only (≥ 0.7) | Conservative standard |
| Client ROI reports | direct + assisted (≥ 0.7); influenced (0.5) disclosed separately | Must label each tier |
| Investor presentations | direct only (0.9) for proven revenue | Most conservative |
| Internal platform KPIs | All levels displayed with tier labels | Full visibility |
| Marketing materials | direct + assisted with "up to X" language | No inferred claims |

---

## 11. ALICE Attribution Gap — Current State

**Known gap as of 2026-06-02:** ALICE decisions recorded in `alice_patient_decisions` are not yet linked to downstream revenue outcomes in `revenue_attribution_records`.

**Impact:** ALICE-influenced revenue cannot be precisely attributed today. Current workaround: manual correlation by practice staff.

**Future sprint plan:** Outcome reconciliation engine will:
1. Match `alice_patient_decisions` records to subsequent `revenue_attribution_records` by `patient_external_id` + time window
2. Auto-populate `alice_decision_id` foreign key on attribution records
3. Enable "Revenue Attributed to ALICE" as a first-class metric in Revenue Command Center

**Governance implication:** Until the outcome reconciliation sprint is complete, do NOT claim ALICE attribution in financial reports. Label any ALICE-correlated revenue as `attribution_method = 'alice_correlated_manual'` with appropriate disclaimer.

---

## 12. Attribution Governance Checklist

Before any new revenue attribution integration is added:

- [ ] `touchpoint_type` is one of the four canonical engines
- [ ] `touchpoint_id` foreign key is validated to exist
- [ ] Attribution confidence level is one of: 0.3, 0.5, 0.7, 0.9
- [ ] Time window check implemented (no retrospective > 90 days)
- [ ] Revenue cap check prevents overclaiming
- [ ] `organization_id` on every record
- [ ] `patient_external_id` used — no PHI
- [ ] AUDIT_EVENT emitted to Event Fabric on every insert
- [ ] Monthly snapshot workflow configured
- [ ] Dispute resolution workflow configured in Revenue Command Center
