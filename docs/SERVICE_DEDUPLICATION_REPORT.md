# Service Deduplication Report

Generated: 2026-06-01

## Canonical Service Map

| Domain | Canonical Service |
| --- | --- |
| Revenue / ROI | `lib/roi.ts` |
| Lead funnel / CRM | `lib/data/leads.ts` |
| Portal operations | `lib/data/operations.ts` |
| Tenant data | `lib/data/tenants.ts` |
| Executive Dashboard | `lib/mission-control/index.ts`, `lib/runtime/*` |
| Automation Platform | `lib/workflow-os/*` |
| Automation OS | `lib/automation-os/registry.ts` |
| ALICE / AI OS | `lib/ai-os/*`, `lib/alice.ts`, `lib/alice/*` |
| PMS | `lib/pms.ts`, `lib/open-dental.ts` |
| Brand | `lib/brand/*` |
| Auth/onboarding | `lib/onboarding/bootstrap.ts`, `app/auth-actions.ts` |

## Duplicate Risk

| Risk | Evidence |
| --- | --- |
| Executive Dashboard state split | `lib/mission-control/index.ts` and `lib/stability.ts` both expose Executive Dashboard-ish state. |
| Automation split | `lib/automation/*` and `lib/automation-os/*` both exist. |
| ALICE split | `lib/alice.ts`, `lib/alice/*`, `lib/ai-os/*`, and `lib/ai/*` all contain AI behavior. |
| Revenue ops split | `lib/roi.ts`, `lib/pilot-operations.ts`, `lib/commercial-operations.ts`, and revenue reports overlap. |
| PMS split | `lib/pms.ts`, `lib/open-dental.ts`, and enterprise integration panels overlap. |

## Action Taken

The ROI Assessment was kept on `lib/roi.ts` and `lib/data/leads.ts` to avoid a parallel revenue engine. No new service was introduced.

## Verdict

Status: PARTIALLY DEDUPLICATED
