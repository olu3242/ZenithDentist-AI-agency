# Benchmarking Engine Report

=======
Date: 2026-06-01

## Benchmark Metrics

Implemented in `buildBenchmarkingFramework`.

- No-show rate
- Recall performance
- Treatment acceptance
- Review generation
- Chair utilization
- Referral generation

## Operating Rules

- Compare only aggregate practice metrics.
- Use normalized metric names across tenants.
- Separate lower-is-better metrics such as no-show rate from higher-is-better metrics.
- Never expose raw patient, appointment, or practice records in benchmark outputs.

## Status

Benchmarking framework is ready for aggregated commercial reporting.
