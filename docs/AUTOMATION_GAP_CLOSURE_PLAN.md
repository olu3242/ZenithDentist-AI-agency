# Automation Gap Closure Plan

> **Platform Maturity Sprint — June 2026**
> Honest assessment of implemented features vs remaining gaps for each automation.

---

## Summary

All six revenue automations have functional TypeScript implementations. The primary gaps are in **real PMS data ingestion** (only Open Dental is a live pilot; others are adapter stubs) and **n8n delivery confirmation** (webhook endpoint exists; actual n8n workflow flows need configuration).

---

## 1. Recall Recovery

**Source:** `lib/dental-revenue-os/recall-recovery.ts`

### Implemented
- `triggerRecallRecovery()` calls `executeWorkflow()` → Automation Platform state machine
- `getRecallRecoveryMetrics()` reads `recall_recovery_events` with RLS tenant isolation
- `recall_recovery_events.appointment_booked` boolean for conversion tracking
- `workflow_execution_id` FK added via migration `202606010002_revenue_attribution.sql`
- Patient FK (`patient_id`) added to `recall_recovery_events`
- `workflow_revenue_attribution` VIEW covers recall booking attribution

### Gaps
| Gap | Priority | Effort |
|-----|----------|--------|
| PMS sync: overdue recall list pulled from real PMS (Open Dental only today) | P0 | Medium |
| n8n SMS/email delivery confirmation receipt writing to `workflow_execution_evidence` | P1 | Medium |
| ALICE prioritization of which patients to contact first (score-based ordering) | P1 | Low |
| `workflow_execution_evidence` table: `sms_delivered`, `booking_confirmed` evidence rows | P1 | Low |

---

## 2. No-Show Prevention

**Source:** `lib/revenue-engine/no-show-prevention.ts`

### Implemented
- `triggerNoShowPrevention()` calls `emitAutomationEvent()` → Event Fabric
- `getNoShowMetrics()` aggregates `automation_events` for `workflow = appointment_no_show`
- Reminder cadence: T-48h, T-24h, T-2h defined in workflow config
- `estimatedRevenueProtected = preventedNoShows × $250` (configurable avg)
- `workflow_executions` row written (non-blocking try/catch)

### Gaps
| Gap | Priority | Effort |
|-----|----------|--------|
| Real appointment feed from PMS (Dentrix/Eaglesoft stubs, Open Dental pilot) | P0 | High |
| n8n SMS confirmation receipts not yet writing `sms_delivered` evidence | P1 | Medium |
| No-show rate tracked via `status = failed` proxy — should be explicit flag | P2 | Low |
| Escalation path (phone call after no-response to SMS) not yet wired | P2 | Medium |

---

## 3. Treatment Acceptance

**Source:** `lib/revenue-engine/treatment-acceptance.ts`

### Implemented
- `triggerTreatmentFollowUp()` emits `ai_followup_required` workflow event
- `getAcceptanceMetrics()` reads `revenue_recovery_events` where `recovery_type = 'treatment_acceptance'`
- `follow_up_days` configurable (default 7)
- `estimated_value` stored in event metadata for pipeline reporting
- `amount_recovered` tracked on conversion

### Gaps
| Gap | Priority | Effort |
|-----|----------|--------|
| Treatment plan data ingested from PMS (currently requires manual trigger) | P0 | High |
| Financing reminder step (step 2 of follow-up sequence) not yet templated | P1 | Low |
| AI confidence score not yet written to event metadata | P1 | Low |
| Acceptance rate baseline needs historical PMS data to be meaningful | P2 | Medium |

---

## 4. Chair Fill

**Source:** `lib/revenue-engine/chair-fill.ts`, `lib/dental-revenue-os/chair-utilization.ts`

### Implemented
- `triggerChairFill()` emits `chair_fill_opportunity` event via `emitAutomationEvent()`
- `getChairFillMetrics()` aggregates `chair_utilization_snapshots`
- `chair_utilization_snapshots` stores: `utilization_pct`, `revenue_per_hour`, `chairs_available`, `chairs_occupied`
- `workflow_execution_id` FK added to `chair_utilization_snapshots`

### Gaps
| Gap | Priority | Effort |
|-----|----------|--------|
| Waitlist patient matching: currently notify_waitlist flag is set but no waitlist query | P0 | Medium |
| Open slot detection from PMS calendar feed (manual trigger today) | P0 | High |
| `revenue_saved` vs `revenue_per_hour` naming inconsistency across APIs | P2 | Low |
| n8n delivery of waitlist SMS/push notifications | P1 | Medium |

---

## 5. Review Growth

**Source:** `lib/dental-revenue-os/review-growth.ts`

### Implemented
- `triggerReviewRequest()` calls `executeWorkflow()` with `review_request_due` trigger
- `getReviewGrowthMetrics()` reads `review_growth_events` (converted, star_rating)
- `review_growth_events.workflow_execution_id` FK added
- Average star rating computed across all events

### Gaps
| Gap | Priority | Effort |
|-----|----------|--------|
| Google Places API integration for confirmed review ingestion | P1 | Medium |
| `converted` flag currently set manually — needs Google webhook or polling | P1 | Medium |
| Star rating collection: no mechanism to receive rating back from patient | P1 | Medium |
| Suppression logic: unhappy patients (low NPS) should not receive review request | P1 | Low |

---

## 6. Referral Growth

**Source:** `lib/revenue-engine/referral-engine.ts`

### Implemented
- `triggerReferralWorkflow()` emits `lead_created` workflow with `referral_detected` trigger
- `getReferralMetrics()` reads `revenue_recovery_events` where `recovery_type = 'referral'`
- Four referral source types: `google`, `internal`, `patient`, `provider`
- Conversion tracked via `outcome = 'converted'` or `status = 'completed'`

### Gaps
| Gap | Priority | Effort |
|-----|----------|--------|
| Automatic promoter detection (NPS ≥ 9) not yet implemented | P1 | Medium |
| `leads` table linkage: referral → new patient record not yet automated | P1 | Medium |
| Referral campaign messaging not yet templated in n8n | P1 | Low |
| Referral attribution window (e.g., 90-day look-back) not enforced | P2 | Low |

---

## Cross-Cutting Gaps

| Gap | Affects | Priority | Effort |
|-----|---------|----------|--------|
| `workflow_execution_evidence` table: not yet written by any engine (table created, not populated) | All 6 | P0 | Medium |
| n8n workflow configuration: webhook endpoint at `/api/webhooks` is ready; n8n flows require manual setup | All 6 | P0 | Medium |
| PMS real-time sync: only Open Dental has a live adapter; Dentrix/Eaglesoft/Denticon are framework stubs | All 6 | P0 | High |
| `ANTHROPIC_API_KEY` required for ALICE LLM prioritization in all engines | All 6 | P0 | Low (config) |
| Evidence layer (`alice_recommendation_traces`): referenced but not yet a database table | ALICE | P1 | Low |

---

## Prioritized Closure Roadmap

### Week 1 (P0)
1. Write `workflow_execution_evidence` rows from existing engine triggers
2. Configure n8n flows for SMS/email delivery with callback to evidence table
3. Validate Open Dental adapter with live pilot practice data

### Week 2 (P1)
4. Google Places webhook for review confirmation
5. Waitlist patient matching for Chair Fill
6. Promoter detection for Referral Growth
7. AI confidence scores in event metadata

### Week 3 (P2)
8. Dentrix and Eaglesoft adapter real-data phase
9. Referral attribution window enforcement
10. Escalation path for No-Show Prevention

---

*Generated: 2026-06-02 | Sprint: Platform Maturity*
