# Mission Control — Master Specification

**Version:** 2.0  
**Status:** Canonical  
**Last Updated:** 2026-06-02  

---

## 1. Purpose

Mission Control is the unified operational command center for ZenithDentist — the single interface through which dental practice staff and Zenith operations teams observe platform performance, manage patient journeys, review AI decisions, and take action on growth opportunities.

---

## 2. Core Principles

- **Single Pane of Glass** — All platform activity visible in one place.
- **Action-Oriented** — Every insight surfaces a clear next action.
- **Role-Based Views** — Content filtered by user role and organization.
- **Real-Time** — Data reflects current state within < 5 minutes.
- **Audit-First** — Every action taken via Mission Control is logged.

---

## 3. User Roles and Access

| Role | Scope | Access Level |
|------|-------|-------------|
| `super_admin` | All organizations | Full platform visibility |
| `agency_admin` | Assigned organizations | Multi-practice portfolio |
| `practice_owner` | Own organization | Full practice access |
| `practice_manager` | Own organization | Operational views |
| `front_desk` | Own organization | Patient-facing operational |
| `read_only` | Own organization | Dashboards only |

---

## 4. Mission Control Modules

### 4.1 Growth Command Center

**Purpose:** Top-level practice health overview  
**Primary Metric:** Growth Score (0-100)  
**Key Panels:**

| Panel | Data Source |
|-------|------------|
| Growth Score Gauge | `growth_scores` |
| 7-Dimension Breakdown | `growth_scores.dimensions` |
| Score Trend (90 days) | `growth_scores` time series |
| ALICE Insights | `alice_patient_decisions` (practice-level) |
| Benchmark Comparison | Portfolio aggregate |

### 4.2 Patient Operations Center

**Purpose:** Patient journey management and outreach oversight  
**Key Panels:**

| Panel | Data Source |
|-------|------------|
| Active Journeys | `journey_assignments` |
| Recall Queue | `recall_tracking` (status = pending) |
| Influence Score Distribution | `patient_influence_scores` |
| At-Risk Patients | Influence tier = at_risk |
| ALICE Patient Decisions | `alice_patient_decisions` |

### 4.3 Revenue Dashboard

**Purpose:** Revenue attribution and ROI reporting  
**Key Panels:**

| Panel | Data Source |
|-------|------------|
| Attributed Revenue (MTD) | `revenue_attribution_records` |
| Revenue by Source | Attribution breakdown by engine |
| ROI Summary | Attributed revenue vs. platform cost |
| Conversion Funnel | Lead → appointment → treatment |
| Growth Score Impact | Revenue growth dimension trend |

### 4.4 Workflow Operations Center

**Purpose:** Workflow health monitoring and DLQ management  
**Key Panels:**

| Panel | Data Source |
|-------|------------|
| Active Workflows | Workflow OS runtime |
| Failed Workflows | DLQ |
| Retry Queue | Workflows in retry state |
| Workflow Volume (24h) | Execution count by type |
| DLQ Items | Pending manual resolution |

### 4.5 AI Intelligence Center

**Purpose:** ALICE decision review and AI performance monitoring  
**Key Panels:**

| Panel | Data Source |
|-------|------------|
| Decision Volume (24h) | `alice_patient_decisions` count |
| AI vs. Fallback Ratio | Path breakdown |
| Average Confidence | Confidence score distribution |
| Recent Decisions | Latest 50 decisions with rationale |
| Low-Confidence Alerts | Decisions with confidence < 0.60 |

### 4.6 Event Stream

**Purpose:** Real-time event monitoring  
**Key Panels:**

| Panel | Data Source |
|-------|------------|
| Live Event Feed | `mission_control_events` |
| Event Volume by Type | Aggregated counts |
| Error Events | Error-classified events |
| Event Lag | Processing delay monitoring |

### 4.7 Operations Center (Staff)

**Purpose:** Day-to-day operational tasks  
**Key Panels:**

| Panel | Data Source |
|-------|------------|
| Portal Access Issues | Access gate failures |
| Membership Alerts | Renewals due, payment failures |
| Onboarding Status | New practice setup progress |
| DLQ Resolution | Dead letter queue items |

---

## 5. Event-Driven Updates

Mission Control receives all updates via the Event Fabric:

```
Platform Action → Event emitted → mission_control_events → UI subscription → Panel refresh
```

Panels subscribe to relevant event types and refresh on new events. Full page refresh is not required — incremental updates via real-time subscription.

### Subscription Pattern

```typescript
const subscription = supabase
  .channel('mission_control')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'mission_control_events',
    filter: `organization_id=eq.${orgId}`
  }, handleEvent)
  .subscribe();
```

---

## 6. Action Capabilities

From Mission Control, authorized users can:

| Action | Role Required | Audit Trail |
|--------|-------------|-------------|
| Trigger manual recall | practice_manager+ | Yes |
| Dismiss ALICE recommendation | practice_manager+ | Yes |
| Override journey assignment | practice_manager+ | Yes |
| Resolve DLQ item | agency_admin+ | Yes |
| Replay workflow | agency_admin+ | Yes |
| Approve portal access | agency_admin+ | Yes |
| Export data | practice_owner+ | Yes |

---

## 7. Portal Access Gate Display

When a practice fails access gates, Mission Control shows a clear remediation path:

| Gate Failed | Display | Action Available |
|-------------|---------|-----------------|
| `contract_signed = false` | "Contract pending signature" | Send contract reminder |
| `setup_fee_paid = false` | "Setup fee outstanding" | Generate payment link |
| `approved_for_access = false` | "Pending approval by Zenith" | Escalate to agency_admin |
| `subscription_active = false` | "Subscription inactive" | Reactivate subscription |

---

## 8. Notification Center

Mission Control routes notifications by severity and role:

| Notification Type | Severity | Routes To |
|------------------|---------|----------|
| DLQ item added | Warning | agency_admin |
| Growth Score drop > 10 points | Alert | practice_owner, agency_admin |
| ALICE fallback rate > 20% | Warning | agency_admin |
| Portal access gate failure | Info | practice_owner |
| P0 incident | Critical | All admins |
| Membership payment failed | Warning | practice_manager |

---

## 9. Performance SLAs

| Metric | Target |
|--------|--------|
| Dashboard load time | < 2 seconds |
| Event feed latency | < 5 seconds |
| Growth Score refresh | < 60 seconds after trigger |
| ALICE decision visibility | < 30 seconds after write |
| DLQ alert delivery | < 2 minutes |

---

## 10. Data Retention in Mission Control

| Data | Retention in UI |
|------|----------------|
| Live event feed | Last 24 hours |
| Workflow history | 90 days |
| ALICE decisions | 30 days (full archive in DB) |
| Revenue reports | 24 months |
| Notifications | 30 days |

---

## 11. Multi-Practice Portfolio View

For `agency_admin` and `super_admin` roles, Mission Control provides a portfolio-level view:

- All practices listed with Growth Score
- Portfolio aggregate Growth Score
- Practices below threshold flagged
- Cross-practice benchmarking
- Portfolio revenue attribution summary
- Practices with open DLQ items highlighted
