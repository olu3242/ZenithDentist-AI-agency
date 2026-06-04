# ROI Assessment Commercialization Report

Generated: 2026-06-01

## Executive Summary

The ROI Calculator has been repositioned as the **FREE Revenue Opportunity Assessment™** and is now the primary lead-generation engine for Zenith PROS™.

Public positioning now emphasizes:

- FREE Revenue Analysis
- FREE Practice Health Score
- FREE Revenue Opportunity Report
- FREE ALICE Revenue Assessment
- FREE Revenue Recovery Estimate
- `$1,500 Consulting Value — FREE`

Primary CTA:

`Get My Free Revenue Assessment`

## UI Implementation

Implemented:

- Multi-step Revenue Opportunity Assessment workflow.
- Practice/contact capture before advanced results.
- Revenue inputs preserving existing ROI calculation fields.
- Advanced result gate behind lead submission.
- ALICE Revenue Opportunity Report preview.
- Practice Health Score preview.
- Revenue Recovery Estimate preview.
- Locked Recall, Treatment, and Chair Fill opportunity values until submission.

Primary component:

- `components/public/roi-funnel-form.tsx`

Updated supporting copy:

- `components/public/pros-landing.tsx`
- `components/public/audit-preview.tsx`

## Preserved ROI Calculations

The existing ROI fields remain active:

- Monthly Revenue Loss
- Yearly Revenue Loss
- Recoverable Revenue
- No-show Loss
- Recall Loss
- Admin Loss
- Confidence

Additional commercial assessment calculations were layered on top:

- Revenue Recovery Opportunity
- Recall Opportunity
- Treatment Opportunity
- Chair Fill Opportunity
- Practice Health Score

Calculation source:

- `lib/roi.ts`

## Database Schema

Created migration:

- `supabase/migrations/20260601150000_roi_assessment_commercialization.sql`

Added to `roi_calculations`:

- `revenue_recovery_opportunity`
- `recall_opportunity`
- `treatment_opportunity`
- `chair_fill_opportunity`
- `practice_health_score`

Added to `audits`:

- `alice_report`
- `ninety_day_snapshot`

Updated type source:

- `lib/database.types.ts`

Migration manifest updated:

- `supabase/MIGRATION_MANIFEST.md`

## API Endpoints

Created:

- `POST /api/roi-assessment`

The endpoint:

- Validates the assessment payload.
- Creates the Supabase lead record.
- Creates ROI calculation record.
- Creates ALICE-backed audit record.
- Queues customer summary email.
- Queues internal sales notification.
- Returns Mission Control lead status and commercial assessment metrics.

Existing server action retained:

- `submitFunnelAction`

## Mission Control Integration

Mission Control lead records are created through the existing lead funnel path:

- `leads.status = audit_requested`
- `leads.source = free_revenue_opportunity_assessment`
- `leads.attribution.assessment_type = free_revenue_opportunity_assessment`
- `leads.attribution.consulting_value = 1500`
- `leads.attribution.mission_control_status = assessment_requested`

Operational events are emitted through:

- `outreach_events`
- `lead_created` automation registry event
- Runtime trace instrumentation

## ALICE Revenue Opportunity Report

Implemented report generator:

- `buildAliceRevenueOpportunityReport`

Report includes:

- Practice Health Score
- Revenue Recovery Estimate
- Revenue Recovery Opportunity
- Recall Opportunity
- Treatment Opportunity
- Chair Fill Opportunity
- Top Revenue Leaks
- Recommended Revenue Playbooks
- 90-Day Opportunity Snapshot
- Executive Summary

Stored in:

- `audits.alice_report`
- `audits.ninety_day_snapshot`

## Lead Routing Workflow

Workflow:

Practice completes assessment
↓
Lead created in Supabase
↓
ROI calculation stored
↓
ALICE report generated
↓
Audit record created
↓
Mission Control attribution attached
↓
Runtime trace started
↓
Outreach event recorded
↓
Lead automation executed
↓
Assessment summary email sent
↓
Internal sales notification sent

## Certification Result

Status: IMPLEMENTED

Evidence:

- UI converted from standalone calculator to gated Revenue Opportunity Assessment.
- Existing ROI calculation path preserved.
- New commercial opportunity metrics persisted.
- ALICE report generated and stored.
- Mission Control lead attribution added.
- API endpoint added for assessment submissions.
- Customer and internal notification emails updated.
