# LIZ Knowledge Model

## Status

Implemented in `lib/liz/knowledge.ts`.

## Knowledge Sources

- Product catalog: `lib/platform-core/product-catalog.ts`
- Workflow catalog: `lib/action-engine.ts`
- Automation catalog: `lib/automation/registry.ts`
- ROI framework: `lib/roi.ts`
- FAQ library: `lib/liz/knowledge.ts`

## Retrieval

LIZ uses deterministic keyword retrieval over normalized knowledge records. Each response returns citations with source and title.

## Knowledge Record

Each record contains:

- id
- source
- title
- body
- tags

## Grounding Rule

LIZ should answer from Zenith capabilities and cataloged workflows. If a question is outside scope, LIZ should route to assessment, support, or a strategy conversation.
