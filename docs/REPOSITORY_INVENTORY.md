# Repository Inventory

Generated: 2026-06-01

## Counts

| Area | File Count |
| --- | ---: |
| `app/` | 116 |
| `components/` | 167 |
| `lib/` | 164 |
| `docs/` | 75 |
| `supabase/migrations/` | 18 |

## Module Classification

| Module | Classification | Notes |
| --- | --- | --- |
| `app/` | Canonical | Next.js App Router application surface. |
| `app/api/` | Canonical | API route layer. |
| `app/portal/` | Canonical | Practice portal surface. |
| `app/mission-control/` | Canonical | Primary Mission Control route. |
| `app/internal/` | Legacy/Candidate for consolidation | Internal views overlap with Mission Control and portal concepts. |
| `app/admin/` | Canonical | Lead/admin CRM surface. |
| `app/dashboard/` | Canonical but broad | Executive dashboard, not role-specific dental dashboards. |
| `components/public/` | Canonical public acquisition surface | Landing and ROI assessment. |
| `components/mission-control/` | Canonical dashboard components | Main runtime/Mission Control library. |
| `components/portal/` | Canonical portal components | Practice portal UI. |
| `components/admin/` | Canonical admin components | Lead/admin UI. |
| `components/enterprise/` | Duplicate/Legacy risk | Overlaps with Mission Control, internal, and platformization views. |
| `components/autonomous/` | Duplicate/Legacy risk | Overlaps with ALICE, Mission Control, runtime intelligence. |
| `components/tenant/` | Canonical tenant UI | Tenant health/benchmarks/location components. |
| `components/brand/` | Legacy | Superseded by `lib/brand` and `components/branding`. |
| `components/branding/` | Canonical | Global Zenith PROS identity components. |
| `components/ui/` | Canonical | Shared UI primitives. |
| `components/ui/canonical/` | Canonical | Added canonical re-export target for shared primitives. |
| `lib/brand/` | Canonical | Single source of brand truth. |
| `lib/data/` | Canonical | Supabase data access. |
| `lib/runtime/` | Canonical | Runtime OS/state modules. |
| `lib/workflow-os/` | Canonical | Workflow OS modules. |
| `lib/mission-control/` | Canonical but overlaps | `lib/stability.ts` also exposes Mission Control state. |
| `lib/stability.ts` | Duplicate/Legacy risk | Older Mission Control queue/state source. |
| `lib/ai-os/` | Canonical AI OS | ALICE/agent runtime. |
| `lib/alice.ts`, `lib/alice/` | Canonical but overlapping | ALICE logic spans multiple folders. |
| `lib/automation-os/` | Canonical | Automation registry state. |
| `lib/automation/` | Legacy risk | Older automation runtime path. |
| `lib/roi.ts` | Canonical | Revenue assessment and ROI calculations. |
| `lib/pms.ts`, `lib/open-dental.ts` | Canonical PMS backend | UI route family incomplete. |
| `supabase/migrations/` | Canonical with frozen legacy | Mixed historical migrations retained; new governance format active. |
| `docs/` | Duplicate/Legacy risk | Many sprint reports overlap and need index/archive discipline. |
| `scripts/` | Canonical utilities | Migration and production validation scripts. |

## Verdict

Status: PARTIALLY CANONICAL

The repo has clear canonical centers, but prior implementation waves left overlapping internal, enterprise, autonomous, and Mission Control modules.
