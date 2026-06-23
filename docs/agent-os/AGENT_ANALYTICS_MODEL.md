# Agent Analytics Model (Batch 9 + 10)

## Learning Loop (Batch 9)

Tables: `agent_learning_events` (id, agent_id, event_type, source, payload, created_at), `agent_performance_scores` (id, agent_id, metric, score, period_start, period_end), `agent_recommendations` (id, agent_id, recommendation, confidence, status, created_at).

Inputs: patient responses, user feedback (`agent_feedback`, Batch 3), execution outcomes (`agent_results`, Batch 4), revenue outcomes (`agent_revenue_attribution`, Batch 7), approval outcomes (`agent_approval_decisions`, Batch 8).

Scoring dimensions: accuracy, conversion, patient satisfaction, revenue generated, completion rate. `PerformanceScoringEngine` aggregates these per agent per period into `agent_performance_scores`; `RecommendationEngine` emits `agent_recommendations` when a scored pattern crosses a confidence threshold (e.g. "IVY recall campaigns convert at 62% → recommend similar strategy for treatment-acceptance campaigns").

## Analytics Engines (Batch 10)

`packages/agent-os/analytics/`:

- `AgentAnalyticsEngine.ts` — raw aggregation: executions count, success rate, revenue influenced, automation coverage, per agent/tenant/period. Reads `agent_executions`, `agent_results`, `agent_revenue_attribution`.
- `AgentScorecardEngine.ts` — produces the per-agent scorecard shape (executions, success rate, revenue influenced, patient satisfaction, health score letter grade A-F).
- `AgentInsightsEngine.ts` — surfaces anomalies/opportunities (e.g. "agent X failure rate doubled this week") for Mission Control's Insights surface.
- `ExecutiveBriefEngine.ts` — generates the daily brief (revenue influenced, agent performance, patient activity, automation coverage, failures, recommendations) attributed to TESS, and the weekly review (revenue leakage, growth opportunities, treatment acceptance trends, recall trends, insurance recovery, patient retention) attributed to ALICE. Both are read-only aggregation; they do not call execution or write new ground-truth data — they compose existing tables into a brief payload that Mission Control renders and that LIZ/ALICE/TESS surfaces can return as text.

## Health Score Formula

`health_score = weighted(success_rate, revenue_per_execution, on_time_rate) → letter grade (A: ≥90, B: ≥80, C: ≥70, D: ≥60, F: <60)`. Computed in `AgentScorecardEngine`, consumed by the Mission Control Health tab and `agent_metrics` (Batch 1) for historical tracking.
