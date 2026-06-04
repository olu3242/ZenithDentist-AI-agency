# AI Agent OS Architecture

## Overview

The AI Agent OS is the autonomous operations layer of the Zenith platform. It consists of ALICE (Chief Intelligence Officer) as the central orchestrator and 7 specialized domain agents that execute practice operations under ALICE's coordination.

**Key design principle:** ALICE observes, predicts, and recommends. Agents execute domain-specific actions within defined governance boundaries. No agent bypasses ALICE coordination or Automation Platform governance.

---

## ALICE vs Agents: Separation of Responsibilities

| Dimension         | ALICE                                    | Domain Agents                          |
|-------------------|------------------------------------------|----------------------------------------|
| Role              | Chief Intelligence Officer               | Domain Executor                        |
| Function          | Observe, predict, recommend, optimize    | Execute domain tasks, generate leads   |
| Data access       | All practice dimensions                  | Domain-specific data only              |
| Execution         | Never executes directly                  | Executes agent_tasks                   |
| Escalation        | Routes to appropriate agent              | Escalates to ALICE or staff            |
| Learning          | Cross-domain pattern recognition         | Domain-specific learning               |

---

## `lib/ai-os` Module Inventory

| Module                        | Purpose                                         |
|-------------------------------|-------------------------------------------------|
| `alice.ts`                    | ALICE entry point — insights, context, coordination, intervention |
| `agent-router.ts`             | Routes tasks to appropriate domain agent        |
| `agent-runtime.ts`            | Builds ALICE context, handles intervention requests |
| `agent-coordinator.ts`        | Coordinates multi-agent workflows, aggregates insights |
| `agent-governance.ts`         | Defines intervention types, governance boundaries |
| `agent-memory.ts`             | Persists and retrieves agent memory snapshots   |
| `agent-observability.ts`      | Logs agent insights to agent_events             |
| `agent-learning.ts`           | Records learning signals for continuous improvement |

---

## Agent Registry — 7 Seeded Agents

The `agent_registry` table is seeded with 7 domain agents at migration time:

| Agent Key               | Display Name              | Domain              |
|-------------------------|---------------------------|---------------------|
| `treatment_coordinator` | Treatment Coordinator     | Treatment acceptance |
| `recall_coordinator`    | Recall Coordinator        | Patient recall       |
| `membership`            | Membership Agent          | Membership programs  |
| `review`                | Review Agent              | Reputation management|
| `referral`              | Referral Agent            | Referral programs    |
| `growth`                | Growth Agent              | Practice growth      |
| `compliance`            | Compliance Agent          | HIPAA, audit         |

---

## Agent Lifecycle

```
ALICE detects opportunity
     │
     ▼
agent_tasks (created, queued)
     │
     ▼
Agent picks up task
     │
     ▼
agent_executions (started, in_progress)
     │
     ▼
Agent generates recommendation
     │
     ▼
agent_recommendations (pending)
     │
     ▼
ALICE reviews recommendation
     │
     ▼
Action executed (Automation Platform, Communication Hub, etc.)
     │
     ▼
agent_recommendations.status = "actioned"
     │
     ▼
agent_metrics updated (tasks executed, revenue influenced)
```

---

## Database Tables

### `agent_registry`
| Column          | Type    | Notes                              |
|-----------------|---------|------------------------------------|
| id              | uuid    |                                    |
| agent_key       | text    | Unique slug                        |
| display_name    | text    |                                    |
| domain          | text    |                                    |
| is_active       | boolean |                                    |
| config          | jsonb   | Agent-specific configuration       |

### `agent_tasks`
| Column          | Type    | Notes                              |
|-----------------|---------|------------------------------------|
| id              | uuid    |                                    |
| organization_id | uuid    |                                    |
| agent_key       | text    |                                    |
| task_type       | text    | Domain-specific task classification|
| status          | text    | queued / running / completed / failed |
| priority        | int     | 1 (highest) – 5 (lowest)          |
| payload         | jsonb   | Task input data                    |
| created_at      | timestamp |                                  |

### `agent_executions`
| Column          | Type    | Notes                              |
|-----------------|---------|------------------------------------|
| id              | uuid    |                                    |
| task_id         | uuid    | FK to agent_tasks                  |
| agent_key       | text    |                                    |
| started_at      | timestamp |                                  |
| completed_at    | timestamp |                                  |
| status          | text    | success / failure                  |
| output          | jsonb   | Execution result                   |
| error           | text    | Error detail if failed             |

### `agent_recommendations`
| Column             | Type    | Notes                           |
|--------------------|---------|---------------------------------|
| id                 | uuid    |                                 |
| organization_id    | uuid    |                                 |
| agent_key          | text    |                                 |
| recommendation_type| text    | Domain-specific type            |
| title              | text    |                                 |
| description        | text    |                                 |
| confidence_score   | float   | 0.0–1.0                         |
| revenue_potential  | int     | Estimated revenue impact (cents)|
| status             | text    | pending / actioned / dismissed  |
| created_at         | timestamp |                               |

### `agent_metrics`
Rolling performance metrics per agent per organization:
- tasks_executed, tasks_succeeded, tasks_failed
- avg_confidence_score
- revenue_influenced (total cents attributed)
- recommendations_actioned, recommendations_dismissed

### `agent_events`
Audit log of all significant agent actions and ALICE insights.

---

## ALICE Coordination Layer

`coordinateAgents(organizationId)` — called periodically (or on-demand) to:
1. Build full operational context from Automation Platform + Event Fabric
2. Retrieve agent memory snapshots
3. Generate top insights and log to `agent_events`
4. Return `AgentCoordinationResult` with operational score and health summary

`aliceCoordinate()` is the public surface. Internally delegates to `agent-coordinator.ts`.

---

## Agent Observability

`logAgentInsight(agentId, organizationId, title, summary, confidence)` — every significant AI insight is persisted to `agent_events`. This provides:
- Full audit trail of agent intelligence
- Input data for agent learning module
- Dashboard data for Executive Dashboard Agent Center

---

## Agent Learning

`recordLearningSignal(agentKey, signalType, payload)` — called after outcomes:
- Treatment accepted → signal to treatment_coordinator
- Appointment kept → signal to recall_coordinator
- Review posted → signal to review agent

Signals feed continuous model improvement over time.

---

## Governance Boundaries

Defined in `agent-governance.ts`:

| Intervention Type          | Who Can Request | Governance Level |
|----------------------------|-----------------|------------------|
| workflow_replay            | Any agent       | Automatic        |
| escalate_to_staff          | Any agent       | Automatic        |
| suspend_workflow           | ALICE only      | Requires reason  |
| modify_tenant_data         | Never directly  | Via Automation Platform  |
| bypass_audit_trail         | Never           | Prohibited       |
