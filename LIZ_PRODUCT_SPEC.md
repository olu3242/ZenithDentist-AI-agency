# LIZ Product Spec

## Status

Implemented.

Primary files:

- `lib/liz/advisor.ts`
- `lib/liz/knowledge.ts`
- `app/api/liz/chat/route.ts`
- `components/public/liz-chat-widget.tsx`
- `app/layout.tsx`

## Role

LIZ is Zenith's customer-facing Revenue and Growth Advisor. LIZ helps prospects and customers understand Zenith, choose workflows, start the free assessment, and route escalation paths.

## Responsibilities

- Answer product questions
- Retrieve grounded FAQ and catalog knowledge
- Detect intent
- Score lead quality
- Recommend assessment next steps
- Escalate sales, support, and enterprise opportunities
- Enforce guardrails

## Conversation Outcomes

- Learn
- Assess
- Book
- Convert

## API

```txt
POST /api/liz/chat
```

Input:

```json
{ "message": "How does Zenith recover revenue?" }
```

Output includes answer, intent, lead score, escalation path, outcome, citations, suggested actions, and guardrail status.
