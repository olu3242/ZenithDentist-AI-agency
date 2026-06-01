# Backup Plan

Date: 2026-06-01

## Required Backups Before Cutover

- Full Supabase database backup.
- Schema-only dump.
- Data-only dump.
- Storage bucket export if production file storage is used.
- Environment variable snapshot.
- Current deployed commit SHA.
- Current migration version list from linked Supabase project.

## Verification Steps

- Confirm backup timestamp.
- Confirm backup restore target exists.
- Confirm backup contains `organizations`, tenant membership, operational metrics, runtime traces, PMS integrations, automation registry, and reports.
- Confirm restore has been tested outside production.

## Certification Result

NOT CERTIFIED

No backup artifact was produced or verified in this local sprint because the Supabase project is not linked.
