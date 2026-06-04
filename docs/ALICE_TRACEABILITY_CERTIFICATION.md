# ALICE Traceability Certification

Status: PARTIAL

Implemented:

- `/internal/alice-traceability`
- Canonical ALICE traceability tables:
  - `alice_decisions`
  - `alice_recommendations`
  - `alice_reasoning`
  - `alice_outcomes`
  - `alice_confidence`
- Decision/recommendation/outcome/confidence rollups

Certification blockers:

- ALICE runtime write-through into traceability tables
- Recommendation trace IDs on every ALICE surface
- Outcome verification against revenue and workflow evidence
