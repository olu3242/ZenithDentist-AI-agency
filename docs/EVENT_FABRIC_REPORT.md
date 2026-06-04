<<<<<<< HEAD
# Event Fabric Report — PROS Sprint
**Generated:** 2026-06-01  
**Canonical Source:** `lib/event-fabric/index.ts` + `lib/runtime/event-fabric.ts`

---

## Event Envelope Structure

Every system publishes events through a standard envelope defined in `lib/event-fabric/index.ts`:

```typescript
interface ZenithEvent<TPayload> {
  event_id: string;         // randomUUID()
  event_type: string;       // e.g. "appointment_no_show"
  event_source: EventSource; // 13 canonical sources
  correlation_id: string;   // trace correlation
  tenant_id: string;        // org-scoped isolation
  workflow_id: string;      // links to workflow registry
  timestamp: string;        // ISO 8601
  priority: EventPriority;  // "low" | "moderate" | "high" | "critical"
  payload: TPayload;        // domain-specific data
}
```

---

## Event Sources (13 Canonical)

Defined as `EventSource` in `lib/event-fabric/index.ts`:

1. `workflow_os`
2. `ai_os`
3. `runtime_kernel`
4. `recovery_engine`
5. `replay_engine`
6. `mission_control`
7. `portal`
8. `client_operations`
9. `lead_operations`
10. `gtm_command_center`
11. `observability`
12. `tenant_context`
13. *(implicit)* `sla_instrumentation` (used in runtime/event-fabric.ts)

---

## Publishing Flow

```
Caller (e.g. triggerNoShowPrevention())
  → publishEvent(opts)                          [lib/event-fabric/index.ts]
    → createEvent(opts)                         [attaches event_id + timestamp]
    → publishRuntimeFabricEvent(event)          [lib/runtime/event-fabric.ts]
      → writes to runtime_event_fabric_events   [Supabase table]
      → aggregates into RuntimeEventFabricState
```

The `publishEvent()` function in `lib/event-fabric/index.ts` is the single entry point. It:
1. Creates a typed `ZenithEvent` with UUID and timestamp
2. Calls `publishRuntimeFabricEvent()` from `lib/runtime/event-fabric.ts`
3. Maps event_source to a fabric channel via `resolveFabricChannel()`
4. Persists to `runtime_event_fabric_events` table

---

## Channel Routing

Events are routed to channels based on source and type via `resolveFabricChannel()`:

| Source | Target Channel |
|--------|---------------|
| `workflow_os` | `workflow_execution` |
| `ai_os` | `ai_inference` |
| `runtime_kernel` | `runtime_ops` |
| `recovery_engine` | `recovery` |
| `replay_engine` | `replay_queue` |
| `mission_control` | `mission_control` |
| `sla_instrumentation` | `governance` |
| All others | `platform` |

Runtime event types: `"trace" | "sla" | "provider" | "replay" | "agent" | "governance" | "tenant"`

---

## Persistence

Events are persisted to the `runtime_event_fabric_events` table (Supabase). The `RuntimeEventFabricState` interface (defined in `lib/runtime/event-fabric.ts`) structures the read model:

```typescript
interface RuntimeEventFabricState {
  events: RuntimeFabricEvent[];
  channels: Array<{ name: string; eventCount: number; pressure: number }>;
  propagationScore: number;
  liveSignalCount: number;
}
```

The `getRuntimeEventFabricState()` function aggregates from:
- `getRuntimeHealthState()` → traces (up to 8) + SLA breaches (up to 5)
- `getProviderHealth()` → degraded/down provider events
- `buildReplayCenterState()` → replay events
- `getOperationalMeshState()` → agent mesh events

---

## Integration with Automation Platform

Every `executeWorkflow()` call in `lib/workflow-os/workflow-engine.ts` publishes a `workflow_os` event via `publishEvent()`. The state machine transitions (registered → executing → completed/failed) each emit an event, creating a full audit trail.

The analytics projector (`lib/analytics/projector.ts`) reads from `runtime_event_fabric_events` to compute:
- Delivery rate (delivered / total)
- Events by type and source
- Live signal count for Executive Dashboard

---

## Readiness Score: 82/100

| Dimension | Score | Evidence |
|-----------|-------|---------|
| Envelope completeness | 95 | All 8 fields present, typed |
| Channel routing | 85 | resolveFabricChannel() implemented |
| Persistence | 90 | runtime_event_fabric_events table exists |
| Source coverage | 80 | 13 sources defined, not all emit actively |
| Analytics integration | 75 | projector reads fabric events |
| Replay support | 70 | lib/event-fabric/replay.ts exists, partial |
| Dead letter capture | 75 | routed via automation_dead_letters |

**Gap:** Event replay via `lib/event-fabric/replay.ts` is scaffolded but the replay execution path primarily routes through `lib/runtime/replay-engine.ts::replayTrace()`. The fabric-level replay module needs to be fully wired.
=======
# Event Fabric Report
**ZenithDentist AI — Event Fabric Canonical Nervous System — Phase 12**
**Date:** 2026-06-03 | **Platform Version:** 12.0.0

---

## 1. Overview

Event Fabric is the **canonical nervous system** of the ZenithDentist AI platform. Every state change across all 11 operating systems flows through Event Fabric. It is the single integration point between systems — no system communicates directly with another; all cross-system signals travel via events.

**Immutable rule:** No new event bus, message queue, or pub/sub system may be introduced. All events use `publishRuntimeFabricEvent()`.

---

## 2. Architecture

```
Any System (Automation Platform, Commercial OS, ALICE, Digital Twin, etc.)
        ↓ calls
publishRuntimeFabricEvent(event: RuntimeFabricEvent)
        ↓ writes to
runtime_event_fabric_events (primary event log)
        ↓ dual-writes to
mission_control_events (executive visibility)
        ↓ triggers
Relevant domain handlers + Executive Dashboard panel refresh
        ↓ replay available via
lib/runtime/workflow-replay.ts
```

---

## 3. publishRuntimeFabricEvent() — Signature

```typescript
function publishRuntimeFabricEvent(event: RuntimeFabricEvent): Promise<void>

type RuntimeFabricEvent = {
  event_type: string              // Dot-notation event name
  practice_id: string             // Practice context (required)
  patient_id?: string             // Patient context (optional)
  payload: Record<string, unknown> // Event-specific data
  source_system: string           // Originating system identifier
  severity?: 'info' | 'warning' | 'critical'  // Default: 'info'
  correlation_id?: string         // For tracing event chains
  idempotency_key?: string        // For deduplication
}
```

Return: `Promise<void>` — resolves after dual-write completes.

---

## 4. Database Tables

### runtime_event_fabric_events

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Event identifier |
| event_type | text | Dot-notation event name |
| practice_id | uuid (FK) | Practice context |
| patient_id | uuid (nullable) | Patient context |
| payload | jsonb | Event-specific data |
| source_system | text | Originating system |
| severity | text | info / warning / critical |
| correlation_id | uuid (nullable) | Trace chain identifier |
| idempotency_key | text (nullable) | Deduplication key |
| created_at | timestamptz | Event timestamp |
| replayed_at | timestamptz (nullable) | If event was replayed |

### mission_control_events (dual-write)

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | MC event identifier |
| fabric_event_id | uuid (FK) | Source event in runtime_event_fabric_events |
| event_type | text | Same as fabric event |
| practice_id | uuid | Practice context |
| display_message | text | Human-readable event description |
| war_room_alert | boolean | True for critical severity events |
| acknowledged | boolean | Whether ops team acknowledged |
| created_at | timestamptz | Event timestamp |

---

## 5. Complete Event Catalog

### Phase 7 + 8 Events (Existing)

| Event Type | Source System | Trigger |
|---|---|---|
| revenue.opportunity.created | Revenue OS | New opportunity identified |
| revenue.opportunity.updated | Revenue OS | Opportunity stage change |
| revenue.opportunity.won | Revenue OS | Opportunity marked won |
| pilot.milestone.reached | Pilot System | Milestone flag set |
| pilot.milestone.at_risk | Pilot System | Milestone behind schedule |
| patient.journey.started | Automation Platform | New patient journey initiated |
| patient.journey.step.completed | Automation Platform | Journey step completed |
| recall.triggered | Automation Platform | Recall campaign triggered |
| treatment.follow_up.sent | Automation Platform | Treatment follow-up delivered |

### Phase 12 Events (New)

#### Commercial OS Events

| Event Type | Source System | Trigger | Key Payload Fields |
|---|---|---|---|
| proposal_created | Commercial OS | createProposal() | proposalId, practiceId, packageId, value |
| proposal_sent | Commercial OS | sendProposal() | proposalId, practiceId, sentAt |
| proposal_accepted | Commercial OS | acceptProposal() | proposalId, practiceId, acceptedAt |
| contract_signed | Commercial OS | signContract() | contractId, practiceId, signedAt |
| subscription_activated | Commercial OS | activateSubscription() | subscriptionId, practiceId, packageId, mrr |
| subscription_cancelled | Commercial OS | cancelSubscription() | subscriptionId, practiceId, reason |

#### Digital Twin Events

| Event Type | Source System | Trigger | Key Payload Fields |
|---|---|---|---|
| digital_twin_updated | Digital Twin OS | snapshotPracticeTwin() | practiceId, twinType, healthScore |
| simulation_completed | Digital Twin OS | runSimulation() | practiceId, projectedDelta, topLever |
| forecast_accuracy_recorded | Digital Twin OS | recordForecastAccuracy() | practiceId, forecastId, accuracyPct |

#### ALICE Executive Events

| Event Type | Source System | Trigger | Key Payload Fields |
|---|---|---|---|
| executive_brief_generated | ALICE | generateExecutiveBriefing() | practiceId, score, topRisk, projectedImpact |
| knowledge_promoted | ALICE | promoteKnowledgeVersion() | practiceId, versionId, versionNumber |
| knowledge_rolled_back | ALICE | rollbackKnowledgeVersion() | practiceId, fromVersion, toVersion |
| recommendation_accepted | ALICE | recordRecommendationFeedback() | practiceId, recommendationId, revenueImpact |
| recommendation_rejected | ALICE | recordRecommendationFeedback() | practiceId, recommendationId |
| alice_retrained | ALICE | retrainFromFeedback() | practiceId, dataPoints, newVersionId |

#### Workflow Recovery Events

| Event Type | Source System | Trigger | Key Payload Fields |
|---|---|---|---|
| workflow_failure_detected | Workflow Recovery | detectWorkflowFailure() | practiceId, workflowId, failureType, affectedJourneys |
| recovery_attempted | Workflow Recovery | attemptRecovery() | practiceId, recoveryId, actionType |
| recovery_successful | Workflow Recovery | confirmRecovery() | practiceId, recoveryId, mttrMinutes |
| workflow_recovered | Workflow Recovery | postRecoveryValidation() | practiceId, workflowId, stabilityScore |

#### Video + Journey Events

| Event Type | Source System | Trigger | Key Payload Fields |
|---|---|---|---|
| video_roi_updated | Video Engine | calculateVideoROI() | practiceId, monthlyVideoRevenue, influencedPatients |
| patient_journey_completed | Automation Platform | Journey final step | practiceId, patientId, journeyType, completionRate |
| video_ab_winner | Video Engine | optimizeVideoContent() | practiceId, journeyType, winnerVariant, liftPct |

#### Forecast Events

| Event Type | Source System | Trigger | Key Payload Fields |
|---|---|---|---|
| forecast_generated | Revenue OS | generateForecast() | practiceId, forecastPeriod, value, confidence |
| forecast_revised | Revenue OS | reviseForecast() | practiceId, forecastId, oldValue, newValue |

---

## 6. Event Routing Table

| Event Category | Primary Channel | Secondary Channel | War Room? |
|---|---|---|---|
| Commercial events | commercial domain | mission_control_events | No |
| Digital Twin events | digital_twin domain | mission_control_events | No |
| ALICE events | alice domain | mission_control_events | No |
| Workflow failure events | workflow domain | mission_control_events | YES (critical) |
| Recovery events | recovery domain | mission_control_events | YES (warning) |
| Pilot milestone events | pilot domain | mission_control_events | YES (on at-risk) |
| Revenue opportunity events | revenue domain | mission_control_events | No |
| Video ROI events | video domain | mission_control_events | No |

---

## 7. Event Replay — lib/runtime/workflow-replay.ts

The workflow replay module enables replaying events for:
- Debugging failed workflows
- Re-triggering journeys after recovery
- Auditing event chains via correlation_id

Key functions:

| Function | Purpose |
|---|---|
| replayEvent | Re-publishes a single event from runtime_event_fabric_events |
| replayEventChain | Replays all events with a given correlation_id in order |
| replayPracticeEvents | Replays all events for a practice from a given timestamp |
| getEventChain | Returns all events in a correlation chain without replaying |
| getDuplicateCheck | Checks idempotency_key to prevent double-processing |

Replay marks replayed events with `replayed_at` timestamp and adds `source: 'replay'` to payload.

---

## 8. Event Volume Estimates

| Category | Events/Day (per practice) | Events/Day (platform) |
|---|---|---|
| Journey steps | 50–200 | 500–2,000 |
| Revenue events | 5–20 | 50–200 |
| Commercial events | 1–5 | 10–50 |
| ALICE/Twin events | 2–10 | 20–100 |
| Recovery events | 0–5 | 0–50 |
| Total (10 practices) | — | ~700–2,400/day |

---

## 9. Event Fabric Health Monitoring

Executive Dashboard System Health panel monitors:

| Metric | Threshold | Alert |
|---|---|---|
| Event write latency | >500ms | Warning |
| Dual-write failure rate | >0.1% | Critical |
| Event queue depth | >1,000 unprocessed | Warning |
| replay_queue backlog | >100 | Warning |
| Critical events unacknowledged | >5 in 1 hour | War room |

---

## 10. Event Fabric Governance Rules

1. All events must include `practice_id` — no anonymous events
2. All events must specify `source_system` — no unattributed events
3. Critical events must use `severity: 'critical'` — enables war room routing
4. Events modifying financial data must include `idempotency_key`
5. Related events in a workflow must share `correlation_id`
6. Events must not contain PII in payload — use IDs and reference tables
7. Event types use snake_case noun-verb format (e.g., `proposal_created`, not `createProposal`)
8. No system may subscribe to another system's events without going through Event Fabric handlers
>>>>>>> backup/pre-consolidation
