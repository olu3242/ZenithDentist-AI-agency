# Event Fabric Report

## Event Flow

`Event Fabric -> Automation Registry -> Workflow OS -> Runtime OS`

## Supported Events

- `lead_created`
- `patient_created`
- `appointment_booked`
- `appointment_missed`
- `review_received`
- `payment_received`
- `campaign_started`
- `campaign_completed`

## Implemented Connection

- Lead funnel side effects now invoke `executeRegisteredAutomation("lead_created")`.
- Manual automation execution emits persistent workflow/automation events.
- Workflow events publish to Runtime Event Fabric for Mission Control visibility.

## Remaining Gap

Additional domain events need direct source-system emitters once PMS, payments, campaigns, and review integrations are connected.
# Final Closure Addendum

Status: VERIFIED

Canonical publisher:

- `publishEvent()` in `lib/event-fabric/index.ts`

Low-level persistence:

- `publishRuntimeFabricEvent()` remains internal to the Event Fabric implementation path.
- Direct workflow and AI observability callers were replaced with `publishEvent()`.
- `lib/runtime/kernel/index.ts` no longer re-exports `publishRuntimeFabricEvent()`.

Current direct references:

- `lib/event-fabric/index.ts`
- `lib/runtime/event-fabric.ts`

Closure result:

- One event publication path exists for platform modules.
- Typecheck passes.
