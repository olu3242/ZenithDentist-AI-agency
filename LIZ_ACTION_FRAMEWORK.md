# LIZ Action Framework

## Status

Implemented.

Primary files:

- `lib/liz/advisor.ts`
- `lib/liz/telemetry.ts`
- `app/api/liz/action/route.ts`
- `components/public/liz-chat-widget.tsx`

## Action Principle

Every LIZ recommendation must become an action. LIZ no longer returns only conversational text; she returns typed actions that can navigate, start assessment, launch workflows, or escalate.

## Supported Action Types

- `navigation`
- `assessment`
- `workflow`
- `sales`
- `support`
- `enterprise`

## Workflow Actions

LIZ can launch:

- Recall Recovery
- Review Campaign
- Treatment Recovery
- Reactivation Campaign
- Lead Nurture Campaign
- Referral Campaign
- No Show Recovery

## UI Contract

The widget renders action cards, CTA buttons, suggested question chips, and workflow cards. Plain-text CTA links are deprecated.
