# Commercialization Foundation Report

## Overview

This document describes the commercialization database layer introduced in
`supabase/migrations/202606020002_commercialization.sql`, which establishes the
subscription plan structure, feature entitlements, usage metering, and billing
event tracking for Zenith Dentist AI.

## Subscription Plans

Four plans are supported, each with a distinct set of feature entitlements:

| Plan         | Key            | Alice Queries | Multi-Location | Digital Twin |
|--------------|----------------|---------------|----------------|--------------|
| Starter      | `starter`      | No            | No             | No           |
| Growth       | `growth`       | 100/month     | No             | No           |
| Professional | `professional` | Unlimited     | Up to 3        | No           |
| Enterprise   | `enterprise`   | Unlimited     | Unlimited      | Yes          |

## Database Tables

### `feature_entitlements` (global config)

Stores the canonical feature matrix per plan. No organization scope — no RLS.
Each row maps a `(plan_key, feature_key)` pair to an enabled flag and optional
numeric limit. Seeded with 39 rows covering all four plans on migration.

Migration: `supabase/migrations/202606020002_commercialization.sql`

### `usage_metering`

Tracks per-organization feature consumption, bucketed by calendar month and
year. The composite index `(organization_id, period_year, period_month)` makes
quota checks fast.

### `plan_limits`

Per-organization overrides for feature limits. Allows custom enterprise deals
or trial extensions without modifying the global entitlements table.

### `billing_events`

Immutable audit log of all Stripe lifecycle events:
`subscription_created`, `subscription_upgraded`, `subscription_downgraded`,
`subscription_cancelled`, `payment_succeeded`, `payment_failed`,
`trial_started`, `trial_ended`.

The `stripe_event_id` column has a UNIQUE constraint to prevent duplicate
webhook processing.

## Application Modules

The database layer is complemented by the following TypeScript modules in `lib/`:

- `lib/commercialization/index.ts` — plan resolution and entitlement lookups
- `lib/commercialization/pricing-engine.ts` — pricing calculation logic
- `lib/commercialization/licensing-engine.ts` — license enforcement
- `lib/commercialization/lifecycle-states.ts` — subscription state machine
- `lib/commercialization/invoice-framework.ts` — invoice generation
- `lib/billing/index.ts` — Stripe webhook handling and billing event writes

## Evidence Layer

The companion migration `supabase/migrations/202606020001_evidence_layer.sql`
introduces eight tables for production traceability:

- `workflow_execution_evidence` — step-level proof of every automation action
- `alice_recommendation_traces` — every ALICE recommendation with confidence
  scores and outcome tracking
- `revenue_attribution_records` — canonical, immutable revenue attribution
- `forecast_runs` — every simulation run is recorded with expected vs actual
- `claim_registry` — business claims backed by evidence IDs
- `mission_control_events` — operational event timeline with severity levels
- `mission_control_actions` — responses to mission control events
- `report_generation_log` — audit trail of all generated reports

All tables enforce row-level security via organization membership.
