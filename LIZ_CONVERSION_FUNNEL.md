# LIZ Conversion Funnel

## Status

Implemented as tracked action events.

## Funnel

```txt
Question
  -> Intent Detection
  -> Lead Score
  -> Grounded Recommendation
  -> Clickable Action
  -> Assessment / Workflow / Escalation
  -> Telemetry
```

## Outcomes

- Learn
- Assess
- Book
- Convert

## Escalations

| Escalation | Action |
| --- | --- |
| Sales | Book Strategy Session |
| Support | Contact Support |
| Enterprise | Enterprise Consultation |

## Measurement

The funnel can be measured from `liz_action_events` by session, event type, intent, lead score, and action type.
