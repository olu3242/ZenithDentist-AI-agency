# Agent Revenue Attribution Model (Batch 7)

## Table

`agent_revenue_attribution` — id uuid, agent_id uuid (FK agent_registry), execution_id uuid (FK agent_executions), tenant_id uuid, revenue_type text, revenue_amount numeric, currency text default 'USD', attribution_confidence numeric, source_event text, created_at timestamptz.

## Supported Attribution Types

Recall booking, treatment acceptance, insurance recovery, review generated, patient reactivation, referral conversion.

## Example Chain

```
IVY → Treatment Follow-up → Case Scheduled → $4,250 Production
```

Recorded automatically: when `ExecutionEngine.run()` completes an execution whose `agent_actions` outcome indicates a revenue-bearing event (e.g. a booking created, a claim paid), it writes a row to `agent_revenue_attribution` with `execution_id` linking back to `agent_executions`, `revenue_type` classifying the channel, and `attribution_confidence` reflecting how directly the agent action caused the outcome (1.0 for direct booking confirmation, lower for assisted/influenced outcomes).

## Relationship to Existing Revenue Attribution

`lib/revenue-attribution/index.ts` already attributes revenue at the **workflow** level (`getWorkflowAttribution(workflowId)`, rolling up `revenue_recovery_events`/`recall_recovery_events`/`review_growth_events` into `revenue_attribution_records`). `agent_revenue_attribution` adds the **agent** dimension on top — the same underlying dollar amount can be visible in both a workflow-level rollup (existing) and an agent-level rollup (new), joined via `execution_id` → `agent_executions.workflow_id`-adjacent context. We do not move or duplicate the dollar figure's source of truth; `agent_revenue_attribution.revenue_amount` is written from the same recovery-event data the existing engine reads, just re-keyed by `agent_id` for the new Mission Control Revenue tab and agent scorecards.
