# 30-Day Activation Plan

> Day-by-day activation guide for launching a pilot practice on the Zenith Patient OS.

---

## Overview

The 30-Day Activation Plan is the operational timeline CSMs and practices follow to go from contract signed to fully active pilot. It is organized into four phases:

| Phase | Days | Focus |
|-------|------|-------|
| Foundation | 1–3 | Infrastructure, integrations, provider assets |
| Content + Journeys | 4–7 | Journey library, scheduling, first delivery |
| Patient OS Activation | 8–14 | Patient import, ALICE, first engagement |
| Revenue + Intelligence | 15–21 | Revenue attribution, health scoring |
| Optimization | 22–30 | KPI review, ALICE tuning, expansion |

---

## Phase 1: Foundation (Days 1–3)

### Day 1 — Infrastructure and Integrations

**Goal**: All system integrations active and implementation project created.

| Task | Owner | Command / Action |
|------|-------|-----------------|
| Create organization in Zenith | CSM | POST /api/internal/organizations |
| Activate client account | CSM | POST /api/internal/activate-client |
| Install OpenDental PMS integration | Engineering | POST /api/integrations { integrationKey: "opendental" } |
| Install Twilio SMS integration | Engineering | POST /api/integrations { integrationKey: "twilio" } |
| Install Resend email integration | Engineering | POST /api/integrations { integrationKey: "resend" } |
| Create implementation project | CSM | POST /api/pilot { action: "create_project" } |
| Verify all integrations active | CSM | GET /api/integrations?organizationId=... |

**Day 1 Success Check**:
```sql
SELECT integration_key, status FROM integration_installations
WHERE organization_id = $1;
-- All 3 integrations: status = 'active'
```

---

### Day 2 — Provider Asset Collection

**Goal**: Provider materials collected, Digital Dentist Twin profile created.

| Task | Owner | Notes |
|------|-------|-------|
| Collect provider video footage | Practice | 2+ minutes, good lighting, direct camera |
| Collect provider audio samples | Practice | 60+ seconds, clean recording |
| Upload assets to secure storage | CSM | S3/Supabase Storage |
| Create provider profile | CSM | POST /api/digital-dentist-twin |
| Confirm avatar profile ID | CSM | Save for Step 3 |

**If practice cannot provide assets today**: Mark task as 'blocked', use generic AI avatar as fallback. Training can be dispatched up to Day 5 without impacting Day 7 delivery (voice trains in 1–2h; avatar trains in 24–48h).

---

### Day 3 — Avatar + Voice Training Dispatched

**Goal**: Digital Dentist Twin in training pipeline.

| Task | Owner | Command |
|------|-------|---------|
| Dispatch avatar training | CSM | POST /api/avatar-studio { action: "dispatch_training" } |
| Dispatch voice training | CSM | POST /api/voice-studio { action: "dispatch_training" } |
| Confirm training jobs queued | CSM | GET /api/avatar-studio?organizationId=... |
| Record Day 3 milestone | CSM | completeImplementationTask(taskId, "Training dispatched") |

**Day 3 Milestone**: Implementation project phase = 'setup', training jobs status = 'queued' or 'training'.

---

## Phase 2: Content + Journeys (Days 4–7)

### Days 4–5 — Journey Library Review

**Goal**: Journey templates reviewed and customized for this practice.

| Task | Owner | Notes |
|------|-------|-------|
| Review global journey templates | CSM | GET /api/journeys?view=templates |
| Customize script templates (optional) | CSM | Update practice name, tone, specific offers |
| Seed missing templates if needed | Engineering | POST /api/journeys { action: "seed_global_templates" } |
| Confirm step definitions have delay_days | Engineering | Query journey_step_definitions |

**Journey types to confirm**:
- `new_patient` — 3 steps: Day 0 welcome, Day 1 follow-up, Day 3 review request
- `recall` — 3 steps: Day 0, Day 7, Day 14 reminders
- `no_show_recovery` — 2 steps: Day 0, Day 2
- `review_request` — 1 step: Day 0

---

### Days 6–7 — Journeys Deployed, First Steps Scheduled

**Goal**: Test patient assigned to journey, Day 0 step executes successfully.

| Task | Owner | Command |
|------|-------|---------|
| Import first batch of patients | CSM | POST /api/integrations/sync { syncType: "patients", limit: 20 } |
| Assign test patient to new_patient journey | CSM | POST /api/journeys { action: "assign", journeyType: "new_patient" } |
| Schedule journey steps | CSM | POST /api/pilot { action: "schedule_journey_steps" } |
| Execute Day 0 steps (scheduledFor <= now) | CSM | POST /api/pilot { action: "execute_due_steps" } |
| Verify first communication sent | CSM | GET /api/pilot → journey_health.steps_delivered_mtd >= 1 |

**Day 7 Milestone**: At least 1 journey step delivered. `journey_scheduled_steps.status = 'delivered'` for at least 1 row.

---

## Phase 3: Patient OS Activation (Days 8–14)

### Day 8 — Full Patient Import

**Goal**: All active patients imported from PMS and influence scores calculated.

| Task | Owner | Command |
|------|-------|---------|
| Full patient sync from OpenDental | Engineering | POST /api/integrations/sync { syncType: "patients" } |
| Trigger influence score calculation | CSM | POST /api/agents/run { action: "recalculate_scores" } |
| Verify scores calculated | CSM | GET /api/patients?organizationId=...&hasScore=true |

**Target**: 100% of active patients have `patient_influence_scores.overall_influence_score` populated.

---

### Day 10 — Welcome Journey First Steps Execute

**Goal**: All new patients assigned and first journey steps delivered.

| Task | Owner | Action |
|------|-------|--------|
| Bulk assign new patients to journeys | CSM | POST /api/journeys { action: "bulk_assign", journeyType: "new_patient" } |
| Execute all due steps | CSM | POST /api/pilot { action: "execute_due_steps" } |
| Confirm delivery rate | CSM | steps_delivered / steps_due ≥ 90% |

---

### Day 12 — ALICE Generates First Recommendations

**Goal**: ALICE has analyzed patient scores and generated at least 5 recommendations.

| Task | Owner | Check |
|------|-------|-------|
| Run ALICE recommendation cycle | CSM | POST /api/agents/run { action: "generate_recommendations" } |
| Review AI Revenue Intelligence recommendations | CSM | GET /api/agents/recommendations?status=pending |
| Present top 3 recommendations to practice owner | CSM | Manual review session |

**Target**: `alice_patient_decisions.count >= 5` with `status = 'pending'`

---

### Day 14 — First Patient Engagement Recorded

**Goal**: At least 1 patient has responded to a Zenith communication.

| Task | Owner | Action |
|------|-------|--------|
| Check engagement events | CSM | GET /api/pilot → pilot_health_events |
| Record engagement if observed via PMS | CSM | POST /api/pilot { action: "record_event", eventType: "patient_engaged" } |
| Run ALICE reconciliation | CSM | POST /api/pilot { action: "reconcile_alice" } |
| Calculate health score | CSM | POST /api/pilot/health { action: "recalculate" } |

**Day 14 Milestone**: `pilot_health_events WHERE event_type = 'patient_engaged' COUNT >= 1`

---

## Phase 4: Revenue + Intelligence (Days 15–21)

### Day 15 — Revenue Attribution Configured and Tested

**Goal**: Revenue attribution pipeline validated end-to-end.

| Task | Owner | Action |
|------|-------|--------|
| Verify attribution records present | CSM | SELECT COUNT(*) FROM revenue_attribution_records WHERE org = $1 |
| If zero: check PMS booking sync | Engineering | Verify appointment creation events flowing |
| Configure attribution confidence minimums | Engineering | Default: 0.50 floor |
| Test manual attribution | CSM | POST /api/alice/outcomes { outcomeType: "appointment_booked" } |

---

### Day 17 — Client Health Score Calculated (Target: ≥ 70)

**Goal**: Health score reflects a functioning, improving practice.

```
POST /api/pilot/health { "action": "recalculate", "organizationId": "..." }
GET /api/pilot/health?organizationId=...
```

**Expected scores at Day 17**:

| Dimension | Expected | If Lower |
|-----------|---------|---------|
| Usage | ≥ 70 | Check agent execution logs |
| Journey Completion | ≥ 50 | Bulk assign more patients |
| Patient Engagement | ≥ 60 | Verify PMS data quality |
| Revenue Attribution | ≥ 25 | Check booking sync |
| Communication Health | 100 | Verify integrations active |
| Provider Adoption | ≥ 50 | Avatar must be active by now |

---

### Day 21 — First Revenue Attribution Confirmed

**THE critical commercial milestone.**

```sql
SELECT
  SUM(attributed_revenue) AS total,
  COUNT(*) AS records
FROM revenue_attribution_records
WHERE organization_id = $1
  AND attribution_date >= date_trunc('month', now());
```

**Success**: `total > 0` and `records >= 1`

**If not achieved**: Immediately escalate per `docs/PILOT_REVENUE_VALIDATION.md` risk protocol.

**Day 21 Milestone**: Revenue attribution confirmed. ROI calculation ready for practice owner.

---

## Phase 5: Optimization (Days 22–30)

### Day 22 — KPI Review with Practice Owner

30-minute review covering:
1. Patients contacted (journey step delivery count)
2. Engagement rate (engaged / delivered × 100)
3. Revenue attributed MTD (from revenue_attribution_records)
4. Health score (from client_health_scores)
5. Top ALICE recommendation actioned

---

### Day 25 — ALICE Learning Signals Reviewed

```
GET /api/alice/outcomes?organizationId={orgId}&view=signals
```

Review:
- Which decision types have highest positive_rate?
- Which have < 40% positive rate? (Confidence threshold auto-adjusted)
- Are there enough outcomes to tune (minimum 5 per type)?

CSM documents findings in implementation_tasks notes.

---

### Day 28 — Expansion Opportunities Identified

```
GET /api/agents/recommendations?organizationId={orgId}&type=expansion
```

Review Growth Agent expansion recommendations:
- Additional providers needing twin provisioning
- Membership program opportunities
- Advanced automation modules
- Multi-location expansion potential

Prepare expansion proposal for Day 30 EBR.

---

### Day 30 — 30-Day Executive Business Review

Follow `docs/EBR_TEMPLATE.md`. Present to practice owner:

1. Platform Health scorecard
2. Patient engagement metrics
3. Revenue impact (attributed MTD, projected annual)
4. AI performance summary
5. 30-day plan for next phase

**Day 30 Milestone**: EBR completed, expansion proposal presented, renewal confidence assessed.

---

## Milestone Summary Table

| Day | Milestone | Success Criteria | Owner |
|-----|-----------|-----------------|-------|
| 3 | Infrastructure complete | All integrations active, training dispatched | CSM + Engineering |
| 7 | First communication delivered | journey_scheduled_steps.status = 'delivered' ≥ 1 | CSM |
| 14 | Patient engagement confirmed | pilot_health_events.event_type = 'patient_engaged' ≥ 1 | CSM |
| 21 | Revenue attribution confirmed | revenue_attribution_records COUNT ≥ 1, SUM > 0 | CSM |
| 30 | Pilot success declared | health_score ≥ 80, ROI ≥ 300% | CSM + CEO |

---

## Related Documents

- `docs/GO_LIVE_RUNBOOK.md` — Detailed commands for each day
- `docs/PILOT_REVENUE_VALIDATION.md` — Day 21 revenue validation
- `docs/ALICE_LEARNING_LOOP.md` — Day 12 and Day 25 ALICE steps
- `docs/EBR_TEMPLATE.md` — Day 30 review template
