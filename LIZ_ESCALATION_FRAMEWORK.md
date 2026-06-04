# LIZ Escalation Framework

## Status

Implemented in `lib/liz/advisor.ts`.

## Escalation Paths

| Path | Trigger |
| --- | --- |
| Sales | Booking intent, high lead score, strategy session interest |
| Support | Existing customer issue, billing issue, login issue, sync problem, system error |
| Enterprise | DSO, multi-location, portfolio, governance, rollout complexity |
| None | General education or early exploration |

## Lead Score Signals

- Assessment interest
- Booking intent
- Enterprise keywords
- Revenue, recall, review, PMS, automation pain
- Urgency
- Multi-location language

## Routing Rule

Assessment comes before strategy booking for standard funnel traffic. Enterprise traffic can be routed to an enterprise strategy path when location count, PMS mix, and rollout scope need review.
