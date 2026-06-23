# Agent Registry

Single source of truth for the 9 named Zenith agents.

## Schema (`supabase/migrations/202606220001_agent_registry.sql`)

- `agent_registry` — `id uuid`, `agent_id text unique` (slug, e.g. `"max"`), `agent_name text`, `title text`, `category text`, `description text`, `status text` (default `active`), `version text`, `created_at`, `updated_at`
- `agent_capabilities` — `agent_id uuid` FK, `capability_key text`, `capability_name text`, `description text`
- `agent_tools` — `agent_id uuid` FK, `tool_name text`, `tool_type text`, `configuration jsonb`
- `agent_metrics` — `agent_id uuid` FK, `metric_name text`, `metric_value numeric`, `captured_at timestamptz`

## Seeded Agents

| Slug | Title | Category |
|---|---|---|
| liz | Patient Concierge | patient-facing |
| alice | Revenue Intelligence Officer | intelligence |
| max | Operations & Scheduling | operations |
| ivy | Patient Success | patient-success |
| finn | Financial Recovery | finance |
| nova | Growth & Reviews | growth |
| quinn | Compliance | compliance |
| rex | Runtime & Reliability | runtime |
| tess | Executive Intelligence | executive |

## Access

Read via `packages/agent-os/router/AgentRegistry.ts`: `getAgentBySlug(slug)`, `getActiveAgents()`, `agentHasCapability(agentId, capabilityKey)`. All access goes through `createServiceClient()` — no direct table access from UI code.
