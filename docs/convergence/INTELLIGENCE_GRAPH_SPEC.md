# Intelligence Graph Specification

## Status: DESIGN COMPLETE

**Date:** 2026-07-04

---

## Purpose

ALICE must reason over relationships between entities, not isolated tables. The intelligence graph defines the canonical entity hierarchy and relationship model that ALICE traverses when generating recommendations, forecasts, and briefings.

---

## Canonical Entity Hierarchy

```
Organization
  └── Location(s)
        └── Provider(s)
              └── Patient(s)
                    └── Appointment(s)
                          └── Treatment(s)
                                └── Workflow(s)
                                      └── Outcome(s)
                                            └── Revenue
```

---

## Entity Definitions

### Organization
- **Table:** `public.organizations`
- **Key fields:** id, name, type, plan, settings
- **ALICE reasoning:** practice group performance, multi-location benchmarking, org-level forecasting

### Location
- **Table:** `public.organizations` (with type = 'location') or location sub-records
- **Key fields:** id, parent_org_id, address, timezone
- **ALICE reasoning:** location-specific performance vs. org benchmark

### Provider
- **Table:** `provider_performance_snapshots` (scores), `leads` (associated appointments)
- **Key fields:** provider_id, specialty, schedule_utilization, production_per_hour
- **ALICE reasoning:** provider coaching, scheduling optimization, production trends

### Patient
- **Table:** `public.leads`, `recall_tracking`, `treatment_plans`, `membership_tracking`
- **Key fields:** id, status, last_appointment, treatment_value, engagement_score
- **ALICE reasoning:** churn risk, treatment acceptance likelihood, recall probability

### Appointment
- **Table:** `public.bookings`
- **Key fields:** id, lead_id, assessment_id, scheduled_at, status
- **ALICE reasoning:** no-show prediction, treatment plan attachment rate

### Treatment
- **Table:** `public.treatment_plans`
- **Key fields:** id, patient_id, treatment_type, value, acceptance_status
- **ALICE reasoning:** case acceptance patterns, financing opportunity

### Workflow
- **Table:** `public.automation_traces` (canonical)
- **Key fields:** id, workflow_type, status, entity_id, started_at, completed_at
- **ALICE reasoning:** workflow success rates, bottleneck identification

### Outcome
- **Table:** `alice_outcome_records`
- **Key fields:** id, entity_type, entity_id, outcome_type, value, measured_at
- **ALICE reasoning:** ROI of executed recommendations, feedback loop calibration

### Revenue
- **Table:** `public.roi_calculations`, `revenue_forecasts`, `revenue_attribution_records`
- **Key fields:** practice_id, period, actual_revenue, projected_revenue, attribution
- **ALICE reasoning:** revenue forecasting, attribution analysis, recovery opportunities

---

## Graph Traversal Patterns

### Pattern 1: Practice Health Assessment
```
Organization
  → all Locations
  → all Providers per Location
  → Provider performance snapshots
  → Patient lists per Provider
  → Appointment history
  → Outcome records
  → Revenue attribution
  → ALICE: composite health score + recommendations
```

### Pattern 2: Patient Risk Assessment
```
Patient (lead record)
  → Appointment history (bookings)
  → Treatment plans (accepted/declined)
  → Recall tracking (overdue/current)
  → Workflow outcomes (journey completion)
  → ALICE: churn risk score + recommended intervention
```

### Pattern 3: Revenue Opportunity Detection
```
Organization
  → Revenue forecasts (gap analysis)
  → Treatment plans (unaccepted, high value)
  → Recall tracking (overdue patients)
  → Insurance opportunities (recovery potential)
  → ALICE: ranked revenue opportunities + expected impact
```

### Pattern 4: Provider Coaching
```
Provider
  → Appointment load (bookings)
  → Treatment acceptance rate (treatment_plans)
  → Production metrics (provider_performance_snapshots)
  → Patient outcomes (alice_outcome_records)
  → ALICE: coaching recommendations + benchmark comparison
```

---

## ALICE Graph API

ALICE should expose graph traversal via:

```typescript
// Traverse from organization down to revenue
await alice.traverseGraph({
  rootEntity: { type: 'organization', id: orgId },
  depth: 'full',  // organization → revenue
  focus: 'revenue_opportunity'
});

// Traverse from patient context
await alice.traverseGraph({
  rootEntity: { type: 'patient', id: patientId },
  depth: 'appointment',
  focus: 'churn_risk'
});
```

---

## Existing Knowledge Graph Infrastructure

The platform already has graph infrastructure:

| Table | Purpose |
|-------|---------|
| `knowledge_graph_nodes` | Entity nodes |
| `knowledge_graph_edges` | Relationships between nodes |

ALICE should leverage these tables for graph persistence and traversal, extending them to cover the canonical hierarchy above.

---

## Implementation Guidance

1. Populate `knowledge_graph_nodes` with entity records on creation (organization, provider, patient, appointment)
2. Populate `knowledge_graph_edges` with relationship records (org → location, location → provider, provider → patient)
3. ALICE traversal queries join through edges to find related entities
4. Outcomes update edge weights (strong relationships = high-value patient-provider pairs)
5. Recommendations target weak edges (low engagement = intervention opportunity)
