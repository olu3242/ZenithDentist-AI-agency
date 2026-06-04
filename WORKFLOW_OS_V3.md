# Automation Platform V3

## Status

Implemented as reusable platform layer.

Primary modules:

- `lib/workflow-os/*`
- `lib/automation-os/registry.ts`
- `components/workflow/workflow-launcher.tsx`
- `lib/platform-os/foundation.ts`

## Purpose

Automation Platform is the product-agnostic execution layer for every automation, task, agent action, and recovery playbook.

## V3 Contracts

- Workflow definition
- Trigger
- Lifecycle state
- Idempotency key
- Tenant override
- SLA
- Outcome metric
- Governance decision

## Capabilities

- Register workflows
- Route events to workflows
- Execute workflows
- Schedule workflows
- Pause, retry, replay, rollback
- Version workflows
- Measure workflow outcomes

## Reusability

The same Automation Platform can power Zenith, Owambe OS, EduRadius, FinClarity, Oasis Go, and future products by changing workflow definitions and tenant policies, not the execution engine.
