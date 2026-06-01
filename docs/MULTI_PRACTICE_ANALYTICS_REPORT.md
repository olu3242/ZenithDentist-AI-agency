# Multi-Practice Analytics Report

Date: 2026-06-01

## Requirements

- No tenant data leakage.
- Aggregated benchmark metrics only.

## Policy

Implemented in `buildMultiPracticeAnalyticsPolicy`.

- Tenant leakage status: blocked
- Permitted data: aggregated benchmark metrics only
- Minimum cohort size: 5 practices
- Forbidden fields: patient identifiers, raw practice records, appointment identifiers, free-text patient notes
- Allowed metrics: no-show rate, recall performance, treatment acceptance, review generation, chair utilization, referral generation

## Status

Cross-tenant analytics are defined as aggregate-only and tenant-safe.
