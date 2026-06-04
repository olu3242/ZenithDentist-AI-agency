# Governance OS

## Status

Implemented as reusable governance foundation.

Primary modules:

- `lib/runtime/governance.ts`
- `lib/workflow-os/workflow-governance.ts`
- `lib/ai-os/agent-governance.ts`
- `lib/tenant/tenant-governance.ts`
- `lib/marketplace-core/extension-governance.ts`

## Purpose

Governance OS ensures autonomous decisions remain auditable, tenant-scoped, policy-aware, and rollback-safe.

## Capabilities

- Policy evaluation
- Approval routing
- Audit timeline
- Trust scoring
- Tenant security verification
- Extension install governance
- Replay governance

## Rule

No AI agent can bypass Workflow OS governance or tenant policy.
