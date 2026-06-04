# Pilot Operations OS

> Transition from architecture-complete to pilot-operational.

---

## Purpose

The Pilot Operations OS bridges the gap between a fully-architected platform and a live, revenue-generating pilot deployment. It provides Executive Dashboard panels, operational dashboards, and success criteria tracking so that Client Success Managers (CSMs) and engineers always know the exact state of a pilot practice.

---

## 7 Core Deliverables

| # | Deliverable | Description | Primary File/Table |
|---|-------------|-------------|-------------------|
| 1 | **pilot_operations_dashboard** | Real-time readiness overview across all Executive Dashboard panels | GET /api/pilot |
| 2 | **onboarding_engine** | Implementation projects + tasks + milestones pipeline | lib/client-success/index.ts |
| 3 | **journey_scheduler_engine** | delay_days → scheduledFor computation + execution | lib/journey-scheduler/index.ts |
| 4 | **alice_outcome_reconciliation** | Decision → outcome → revenue feedback loop | lib/alice/outcome-reconciliation.ts |
| 5 | **pilot_revenue_dashboard** | Attribution tracking + ROI validation | revenue_attribution_records |
| 6 | **pilot_health_monitor** | 6-dimension weighted health score + tier classification | client_health_scores |
| 7 | **go-live runbook** | Step-by-step launch guide for CSMs and engineers | docs/GO_LIVE_RUNBOOK.md |

---

## Executive Dashboard Panels

### Panel 1: Pilot Readiness

Tracks whether the foundational infrastructure is configured and operational.

| Check | Data Source | Pass Condition |
|-------|-------------|----------------|
| Organization created | organizations table | row exists |
| Client account activated | client_accounts.status | status = 'active' |
| Implementation project created | implementation_projects | phase != null |
| PMS integration installed | integration_installations | integrationKey = 'opendental' AND status = 'active' |
| Communication integration installed | integration_installations | integrationKey IN ('twilio', 'resend') AND status = 'active' |

**API**: `GET /api/pilot` → `readiness_check` object

---

### Panel 2: Journey Health

Monitors journey assignment and scheduled step execution state.

| Metric | Data Source | Healthy Range |
|--------|-------------|---------------|
| Active journey assignments | journey_assignments.status = 'active' | ≥ 1 |
| Scheduled steps due | journey_scheduled_steps WHERE scheduledFor <= now() AND status = 'pending' | 0 (all executed) |
| Steps delivered (MTD) | journey_scheduled_steps.status = 'delivered' | increasing |
| Steps failed | journey_scheduled_steps.status = 'failed' | 0 |
| Journey completion rate | completed / total assignments | target ≥ 60% |

**API**: `GET /api/pilot` → `journey_health` object

---

### Panel 3: Avatar Readiness

Tracks Digital Dentist Twin training and activation status.

| Check | Data Source | Pass Condition |
|-------|-------------|----------------|
| Provider profile created | avatar_profiles | row exists for org |
| Avatar training dispatched | avatar_training_jobs.status | 'queued' or 'training' |
| Avatar training complete | avatar_profiles.status | 'ready' |
| Avatar activated | avatar_profiles.status | 'active' |
| Voice profile active | voice_profiles.status | 'active' |

---

### Panel 4: Communication Readiness

Validates that outbound communication channels are live.

| Channel | Integration Key | Status Field | Pass |
|---------|----------------|--------------|------|
| SMS | twilio | integration_installations.status | active |
| Email | resend | integration_installations.status | active |
| Phone/IVR | twilio_voice | integration_installations.status | active (optional) |

**Fallback**: If communication providers are not configured, journey steps queue internally but do not deliver. CSM must resolve before Day 7.

---

### Panel 5: Revenue Validation

Confirms that the revenue attribution pipeline is producing records.

| Metric | Table | Target |
|--------|-------|--------|
| Total attributed revenue MTD | revenue_attribution_records | > $0 by Day 21 |
| Attribution records count | revenue_attribution_records | ≥ 1 by Day 21 |
| ALICE-linked revenue | alice_outcome_records.revenue_attributed | > $0 by Day 21 |
| ROI ratio | attributed / subscription_fee | ≥ 3.0x by Day 30 |

---

### Panel 6: ALICE Learning Loop

Monitors ALICE decision quality and outcome feedback cycle health.

| Metric | Table | Target |
|--------|-------|--------|
| Decisions pending | alice_patient_decisions.status = 'pending' | > 0 |
| Outcomes recorded | alice_outcome_records | ≥ 1 by Day 14 |
| Accuracy rate | getAliceAccuracyMetrics().accuracyRate | ≥ 60% |
| Stale decisions auto-reconciled | alice_outcome_records.outcome_type = 'no_outcome' | < 20% of total |

---

## Success Criteria Table

The following 8 criteria define a successful pilot launch. Each must be evidenced by live data before the pilot is considered operationally confirmed.

| # | Success Criterion | Evidence Table/Field | Evidence Condition |
|---|------------------|---------------------|-------------------|
| 1 | First dental practice onboarded | implementation_projects.phase | phase = 'go_live' |
| 2 | Avatar active | avatar_profiles.status | status = 'active' |
| 3 | Voice active | voice_profiles.status | status = 'active' |
| 4 | Welcome journey delivered | journey_scheduled_steps | status='delivered' AND journey_type='new_patient' |
| 5 | Patient engagement recorded | pilot_health_events | event_type='patient_engaged' (count ≥ 1) |
| 6 | ALICE recommendation generated | alice_patient_decisions | status='pending' count > 0 |
| 7 | Revenue attribution recorded | revenue_attribution_records | count > 0 |
| 8 | Pilot health score ≥ 90 | client_health_scores.overall_score | overall_score > 90 |

---

## Operational Monitoring

### Real-Time Dashboard Endpoint

```
GET /api/pilot?organizationId={orgId}
```

Returns:
```json
{
  "readiness_check": { ... },
  "journey_health": {
    "active_assignments": 3,
    "scheduled_steps_due": 0,
    "steps_delivered_mtd": 12,
    "steps_failed": 0
  },
  "revenue_attribution_score": 45,
  "alice_learning_health": { ... },
  "overall_health_score": 78,
  "health_tier": "yellow"
}
```

### Health Recalculation

```
POST /api/pilot/health
{ "organizationId": "...", "action": "recalculate" }
```

Triggers `calculateClientHealthScore()` in lib/client-success/index.ts and writes a new row to client_health_scores.

---

## Escalation Protocol

| Health Tier | Score Range | CSM Action | Engineering Action |
|-------------|-------------|------------|-------------------|
| Green | ≥ 80 | Proactive EBR scheduling | None required |
| Yellow | 60–79 | Check-in within 48h | Review failed steps, check integrations |
| Red | < 60 | Immediate escalation | Root cause analysis within 4h |

---

## Related Documents

- `docs/GO_LIVE_RUNBOOK.md` — step-by-step launch commands
- `docs/JOURNEY_SCHEDULER_ARCHITECTURE.md` — scheduler internals
- `docs/ALICE_LEARNING_LOOP.md` — ALICE feedback loop
- `docs/CLIENT_HEALTH_FRAMEWORK.md` — health score dimensions
- `docs/30_DAY_ACTIVATION_PLAN.md` — day-by-day milestones
