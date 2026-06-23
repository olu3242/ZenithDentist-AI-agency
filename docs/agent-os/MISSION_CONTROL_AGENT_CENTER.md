# Mission Control — Agent Center (Batch 6)

**Route:** `app/mission-control/agents/page.tsx` (`/mission-control/agents`)

A read-only ops view over the Agent OS layers (Batches 1-10). Follows the existing Mission Control panel convention: a server component that fetches data in parallel and renders plain sections/tables (no new UI framework).

## Tabs / Sections

| Section | Reads from |
|---|---|
| Overview | `AgentAnalyticsEngine.getAgentStats` (per agent, aggregated), `AgentScorecardEngine.gradeFromSuccessRate`, `ApprovalRequestStore.listPending` |
| Registry | `agent_registry`, `agent_capabilities` (count), `agent_executions` (last execution), `AgentScorecardEngine.getScorecard` (health score) |
| Executions | `AgentAnalyticsEngine.getAgentStats` — executions count + success rate per agent |
| Revenue | `AgentRevenueAttributionStore.getAttributionSummary` — total, by revenue type |
| Approvals | `ApprovalRequestStore.listPending` — pending `agent_approval_requests` rows |
| Learning | `LearningEventStore.listEvents` — recent `agent_learning_events` per agent |
| Health | `AgentScorecardEngine.getScorecard` + `AgentInsightsEngine.getInsights` (anomalies) |
| Settings | Static notice — approval rule configuration lives in `agent_approval_rules`; no settings UI in this read-only view |

## Notes

- All data fetches use `createServiceClient()` from `@/lib/supabase/server`, matching the convention in `packages/agent-os/*`.
- This route does not duplicate `app/mission-control/page.tsx` — it is a separate route segment dedicated to the Agent OS layer, reusing the same `AppShell` and Tailwind utility classes (`border-line`, `bg-paper`, `text-ink`, `text-muted`, `brand-kicker`).
- The Overview tile set matches the spec: Active Agents, Executions Today, Revenue Influenced, Automation Coverage, Success Rate, Pending Approvals, Failed Executions, Agent Health Score.
- The Registry table matches the spec: Agent, Role, Status, Capabilities, Version, Last Execution, Health Score.
