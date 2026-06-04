# Action Engine

## Status

Implemented.

Primary files:

- `lib/action-engine.ts`
- `components/workflow/action-card.tsx`
- `components/workflow/workflow-launcher.tsx`
- `components/workflow/alice-action-layer.tsx`
- `components/dashboard/persona-command-center.tsx`

## Universal Action Framework

Every action-capable widget now follows:

```txt
View
Analyze
Recommend
Execute
```

The action engine represents this through `UniversalAction.stage`:

- `view`: open the operating surface for the problem
- `analyze`: expose root causes and source signals
- `recommend`: show ALICE recommendation context
- `execute`: launch the mapped workflow

## Widget Contract

Each action card contains:

- Business problem
- Root cause
- ALICE recommendation
- Expected outcome
- Workflow launch action

## Implemented Surfaces

- Persona command centers
- Revenue Command Center
- Growth Command Center
- Operations Command Center
- ALICE recommendation panels

## Rule

Dashboard cards should no longer exist as passive metric cards when they describe a solvable business problem.
