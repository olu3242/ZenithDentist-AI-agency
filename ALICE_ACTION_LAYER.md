# ALICE Action Layer

## Status

Implemented in `components/workflow/alice-action-layer.tsx`.

## Recommendation Actions

Every rendered ALICE action supports:

- Approve
- Modify
- Reject
- Execute

## Current Behavior

`Execute` launches the mapped workflow immediately through Workflow OS. Approve, Modify, and Reject are UI controls prepared for recommendation decision persistence.

## Required Persistence Follow-Up

Add an `alice_recommendation_actions` table with:

- recommendation id
- workflow id
- action decision
- modified payload
- owner profile id
- organization id
- created at
- outcome id

## Rule

ALICE recommendations are not complete unless they can become workflow actions.
