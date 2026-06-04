# ALICE Advisor Report

Date: 2026-06-01

## Required Outputs

Verified through `verifyAlicePracticeAdvisor` in `lib/pilot-operations.ts`.

- Daily Summary
- Weekly Summary
- Revenue Opportunities
- Automation Risks
- Patient Recovery Opportunities
- Executive Recommendations

## Evidence

ALICE remains grounded through:

Events -> Analytics Projector -> Metrics -> ALICE -> Executive Dashboard

The implementation uses `generateAliceReport` and `analyticsProjector`; it does not let ALICE bypass analytics.

## Status

ALICE Practice Advisor is operationally ready when projection confidence is available.
