# Unified Workflow Launcher

## Status

Implemented.

Primary files:

- `components/workflow/workflow-launcher.tsx`
- `app/automation-center/actions.ts`
- `lib/automation-os/registry.ts`

## Launch Sources

Workflows can now be launched from:

- Dashboard action cards
- Persona command centers
- Revenue Command Center
- Growth Command Center
- Operations Command Center
- AI Revenue Intelligence recommendations
- Automation Center

## Behavior

The launcher submits to `executeAutomationAction`, which executes through:

```txt
executeAutomationAction
  -> executeRegisteredAutomation
    -> executeWorkflow
      -> automation runtime
      -> runtime traces
      -> event fabric
```

## Return-To Flow

Launchers pass a `returnTo` path so users return to the workflow surface where the action began. This prevents workflows from requiring navigation to Automation Center.

## Guardrail

`returnTo` is sanitized to relative application paths only.
