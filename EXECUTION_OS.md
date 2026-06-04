# Execution OS

## Purpose

Execute decisions.

## Components

- Workflow Launcher
- Agent Orchestrator
- Automation Engine
- Task Engine

## Capabilities

- Launch
- Pause
- Retry
- Rollback
- Escalate

## Implementation

- `components/workflow/workflow-launcher.tsx`
- `lib/workflow-os/workflow-engine.ts`
- `lib/automation-os/registry.ts`
- `lib/ai-os/agent-coordinator.ts`

## Rule

Every autonomous execution enters through Automation Platform. No product module should execute side effects directly.
