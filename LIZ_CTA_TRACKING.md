# LIZ CTA Tracking

## Status

Implemented.

Primary files:

- `lib/liz/telemetry.ts`
- `app/api/liz/action/route.ts`
- `supabase/migrations/20260617000000_liz_action_events.sql`

## Events Tracked

- CTA Clicks
- Assessment Starts
- Assessment Completions
- Strategy Session Clicks
- Workflow Launches
- Sales Escalations
- Support Escalations
- Enterprise Escalations

## Storage

Telemetry persists to:

```txt
public.liz_action_events
```

## Stored Fields

- session id
- event type
- action id
- action label
- action type
- workflow id
- href
- page
- lead score
- intent
- escalation path
- message
- metadata
