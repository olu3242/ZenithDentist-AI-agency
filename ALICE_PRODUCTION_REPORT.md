# ALICE Production Report

Generated: 2026-06-01

## Status

PARTIAL.

## Verified

- ALICE APIs exist and compile.
- `lib/alice.ts` consumes `analyticsProjector()`.
- `analyticsProjector()` derives from runtime event fabric, automation traces, workflow analytics, automation registry, and tenant data.

## Gaps

- No direct e2e ALICE production test exists.
- Google OAuth/session identity is not wired into ALICE requests.
- Some ALICE-supporting modules still use fallback empty states when Supabase data is unavailable.

## Release Decision

PARTIAL. ALICE is architecturally connected to analytics, but production grounding must be verified against live tenant data.
