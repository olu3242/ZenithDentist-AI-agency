# LIZ Workflow Integration

## Status

Implemented.

Primary route:

```txt
POST /api/liz/action
```

## Execution Flow

```txt
LIZ action button
  -> /api/liz/action
    -> track LIZ telemetry
    -> executeRegisteredAutomation
      -> Workflow OS
      -> Runtime OS
      -> trace / event fabric
```

## Supported Workflow IDs

- `recall_due`
- `review_request_due`
- `treatment_recovery`
- `reactivation_candidate_detected`
- `lead_created`
- `referral_growth`
- `appointment_no_show`
- `alice_revenue_opportunity_agent`

## Guardrail

Only actions with `actionType: "workflow"` and a `workflowId` launch workflows.
