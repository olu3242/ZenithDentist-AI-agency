# Baseline Metrics Report

Date: 2026-06-01

## Required Baseline Metrics

- No-show rate
- Recall rate
- Treatment acceptance rate
- Review volume
- Referral volume
- Chair utilization
- Production
- Collections

## Storage

Baseline capture is implemented in `storeBaselineMetrics` in `lib/pilot-operations.ts`.

Storage uses existing data surfaces:

- `operational_metrics` for measurable dashboard continuity
- `organizations.settings.pilot_baseline` for the full baseline object

## Mapping

- No-show rate -> `operational_metrics.no_show_rate`
- Recall rate -> `operational_metrics.patient_engagement_rate`
- Review volume -> `operational_metrics.reviews_generated`
- Confirmation rate -> `100 - no_show_rate`
- Full production, collections, chair utilization, referral, and treatment acceptance values -> `organizations.settings.pilot_baseline`

## Status

Baseline capture is ready for real practice intake.
