# Agent Workforce Architecture

## Status

Implemented as registry and API.

Primary files:

- `lib/agent-workforce.ts`
- `app/api/agents/workforce/route.ts`

## Architecture

```txt
LIZ
  -> Customer conversations

ALICE
  -> Chief Operating Intelligence
  -> Coordinates specialized agents

Specialized Agents
  -> Execute through Event Fabric, Automation Platform, Runtime OS, Knowledge OS
```

## Communication Rule

Agents do not directly couple to each other. They communicate through:

- Event Fabric
- Automation Platform
- Runtime OS
- Knowledge OS

## API

```txt
GET /api/agents/workforce
```
