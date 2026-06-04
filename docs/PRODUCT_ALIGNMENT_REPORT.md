# Product Alignment Report

Date: 2026-06-01

## Scope

Specialist: Product Strategy Director

Compared legacy PRD against current PROS.

## Preserved Requirements

- Revenue recovery positioning is preserved.
- ROI calculator logic is preserved in `lib/roi.ts` and public funnel components.
- No-show prevention and recall recovery are preserved and expanded into playbooks.
- Review generation remains in current playbook and automation design.
- Dashboard and reporting concepts remain present.
- PMS integration vision remains present through `lib/pms.ts` and `/portal/integrations`.

## Expanded Requirements

- Legacy Revenue Recovery System expanded into Patient Revenue Operating System.
- Revenue Playbooks now cover No Show Prevention, Recall Recovery, Chair Fill, Treatment Acceptance, Review Growth, and Referral Growth.
- ALICE adds operational intelligence, reports, recommendations, and executive summaries.
- Executive Dashboard expands beyond dashboarding into runtime, recovery, event fabric, governance, and provider health.
- Pilot operations and commercial operations are defined.
- Migration governance is now formalized.

## Missing Requirements

- Legacy PRD patient-domain tables (`patients`, `appointments`, `reviews`) are not present as canonical migrations.
- True PMS Portal components are incomplete.
- Live production public access is blocked by Vercel.
- Remote Supabase state is not reconciled.

## Obsolete Requirements

- Legacy single-practice `practices` tenant model is superseded by `organizations`, `organization_members`, and `locations`.
- Legacy Next.js 14 folder plan is superseded by current Next.js 15 app routes.
- Legacy basic dashboard has been superseded by portal dashboard plus Executive Dashboard.

## Result

PROS expands the legacy PRD substantially, but V2 must harmonize patient-domain schema, PMS portal, and deployment/migration evidence.
