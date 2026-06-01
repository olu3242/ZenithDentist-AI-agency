# ALICE Report

Status: VERIFIED

Canonical ALICE grounding:

- `lib/alice.ts` now calls `analyticsProjector()`.
- `lib/ai-os/alice.ts` grounds insights in projection scores.
- ALICE enterprise coordination receives both enterprise context and analytics projection context.
- Agent coordination now normalizes insight titles and summaries to strict strings.

Data consumed:

- Analytics projection
- Workflow trace-derived analytics
- Event Fabric live signal counts
- Automation registry and execution counts
- Runtime unresolved failures and dead-letter counts

Data path intentionally avoided:

- Direct portal metric recomputation inside ALICE core.
- Direct low-level event publication from ALICE observability.

Closure result:

- ALICE intelligence path converged.
- ALICE observability publishes through `publishEvent()`.
- Typecheck passes.

