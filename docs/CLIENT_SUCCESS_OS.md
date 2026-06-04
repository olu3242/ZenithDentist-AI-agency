# Client Success OS™

> Repeatable, measurable deployment framework for dental practice onboarding.

---

## Purpose

The Client Success OS transforms client onboarding from an ad-hoc process into a structured, data-driven system. It tracks every implementation task, monitors health at each lifecycle stage, and provides CSMs with a clear operational picture of every account.

---

## Client Lifecycle

```
Lead → Qualified → Proposal → Closed Won → Implementation → Training → Activation → Optimization → Expansion → Renewal
```

| Stage | Definition | Primary System |
|-------|------------|----------------|
| Lead | Prospect identified | CRM (external) |
| Qualified | Budget + fit confirmed | CRM (external) |
| Proposal | Contract sent | CRM (external) |
| Closed Won | Contract signed, setup fee paid | client_accounts.status = 'pending_activation' |
| Implementation | Platform configured, data imported | implementation_projects |
| Training | Practice staff trained | implementation_milestones |
| Activation | First patient journey delivered | journey_scheduled_steps.status = 'delivered' |
| Optimization | Health score ≥ 80, ALICE learning active | client_health_scores.overall_score >= 80 |
| Expansion | Additional providers, locations, or modules | agent_recommendations.recommendation_type = 'expansion' |
| Renewal | Contract renewal process | client_accounts.renewal_date |

---

## Core Library: `lib/client-success/index.ts`

### 6 Primary Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `calculateClientHealthScore(orgId)` | Compute 6-dimension weighted score | `{ overall_score, dimensions, tier }` |
| `getClientHealthScore(orgId)` | Retrieve latest stored score | `ClientHealthScore` row |
| `getImplementationStatus(orgId)` | Get project + task + milestone state | `ImplementationStatus` object |
| `createImplementationProject(orgId, params)` | Create new implementation project | `implementation_projects` row |
| `completeImplementationTask(taskId, notes)` | Mark task complete + update milestone | `void` |
| `recordPilotEvent(orgId, eventType, metadata)` | Log health event for monitoring | `pilot_health_events` row |

---

## Database Tables

### `implementation_projects`

Tracks the top-level implementation lifecycle for each client.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `organization_id` | uuid | FK → organizations.id |
| `project_name` | text | Human-readable name |
| `phase` | text | discovery \| setup \| training \| activation \| go_live |
| `target_go_live_date` | date | CSM-set target |
| `actual_go_live_date` | date | Set when phase = 'go_live' |
| `csm_id` | uuid | Assigned CSM user |
| `created_at` | timestamptz | Project creation |
| `updated_at` | timestamptz | Last update |

**Phase transitions**:
`discovery` → `setup` → `training` → `activation` → `go_live`

### `implementation_tasks`

Granular checklist items within each project.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `project_id` | uuid | FK → implementation_projects.id |
| `organization_id` | uuid | Tenant isolation |
| `task_name` | text | Task description |
| `task_type` | text | integration \| training \| configuration \| validation |
| `owner` | text | csm \| engineering \| practice |
| `status` | text | pending \| in_progress \| complete \| blocked |
| `due_date` | date | Target completion |
| `completed_at` | timestamptz | Actual completion |
| `notes` | text | Completion notes |

### `implementation_milestones`

Key milestone checkpoints that gate phase transitions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `project_id` | uuid | FK → implementation_projects.id |
| `milestone_name` | text | e.g., "PMS Integration Active" |
| `milestone_type` | text | technical \| operational \| commercial |
| `required_for_phase` | text | Which phase this must clear |
| `status` | text | pending \| achieved \| waived |
| `achieved_at` | timestamptz | When milestone cleared |

### `client_health_scores`

Time-series health score records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `organization_id` | uuid | Tenant isolation |
| `overall_score` | numeric | 0–100 weighted score |
| `usage_score` | numeric | Usage dimension (0–100) |
| `journey_completion_score` | numeric | Journey dimension (0–100) |
| `patient_engagement_score` | numeric | Engagement dimension (0–100) |
| `revenue_attribution_score` | numeric | Revenue dimension (0–100) |
| `communication_health_score` | numeric | Comms dimension (0–100) |
| `provider_adoption_score` | numeric | Provider dimension (0–100) |
| `tier` | text | green \| yellow \| red |
| `top_risk` | text | Highest-risk dimension label |
| `top_opportunity` | text | Highest-opportunity action |
| `score_date` | date | Calculation date |
| `calculated_at` | timestamptz | Exact calculation time |

### `pilot_health_events`

Event log for pilot monitoring.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `organization_id` | uuid | Tenant isolation |
| `event_type` | text | patient_engaged, step_delivered, revenue_attributed, etc. |
| `patient_id` | uuid | Optional FK → patients.id |
| `metadata` | jsonb | Event-specific data |
| `created_at` | timestamptz | Event timestamp |

---

## API Reference

### Pilot Dashboard

```
GET /api/pilot?organizationId={orgId}
```

Returns combined view: readiness check, journey health, ALICE health, revenue score, overall health tier.

```
POST /api/pilot
{ "action": "create_project" | "schedule_journey_steps" | "reconcile_alice" | "record_event" }
```

### Health Score

```
GET /api/pilot/health?organizationId={orgId}
```

Returns latest `client_health_scores` row for the organization.

```
POST /api/pilot/health
{ "organizationId": "...", "action": "recalculate" }
```

Triggers `calculateClientHealthScore()` and writes a new row to `client_health_scores`.

---

## Client Health Score: 6 Dimensions

| Dimension | Weight | Data Source | Calculation |
|-----------|--------|-------------|-------------|
| Usage | 20% | agent_executions | success_rate MTD × 100 |
| Journey Completion | 20% | journey_assignments | completed / total × 100 |
| Patient Engagement | 20% | patient_influence_scores | avg overall_influence_score |
| Revenue Attribution | 20% | revenue_attribution_records | count MTD → 0–100 scale |
| Communication Health | 10% | integration_installations | active integrations / 2 × 100 |
| Provider Adoption | 10% | avatar_profiles | active count > 0 → 100 else 0 |

**Overall Score** = Σ(dimension_score × weight)

**Tiers**:
- **Green** (≥ 80): Healthy, proactive expansion review
- **Yellow** (60–79): CSM check-in within 48 hours
- **Red** (< 60): Immediate CSM escalation

---

## CSM Workflow Integration

### Daily Check (< 5 minutes)

```
GET /api/pilot?organizationId={orgId}
```

Check:
1. `journey_health.scheduled_steps_due` — should be 0
2. `journey_health.steps_failed` — should be 0
3. `health_tier` — green is healthy

### Weekly Health Recalculation

```
POST /api/pilot/health { "action": "recalculate", "organizationId": "..." }
```

Review dimension scores to identify which area needs attention.

### Monthly EBR Preparation

Pull all data needed for `docs/EBR_TEMPLATE.md` using:

```
GET /api/pilot?organizationId={orgId}
GET /api/pilot/health?organizationId={orgId}
GET /api/alice/outcomes?organizationId={orgId}
GET /api/agents/recommendations?organizationId={orgId}
```

---

## Related Documents

- `docs/CLIENT_HEALTH_FRAMEWORK.md` — detailed health score dimension logic
- `docs/30_DAY_ACTIVATION_PLAN.md` — lifecycle activation timeline
- `docs/EBR_TEMPLATE.md` — monthly review template
- `docs/EXPANSION_ENGINE.md` — expansion opportunity detection
