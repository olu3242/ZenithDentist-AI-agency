# PMS Health Score Model

## Model Inputs

| Signal | Evidence | Weight |
| --- | --- | ---: |
| Connection status | PMS operations center, integration manager | 20 |
| Sync freshness | PMS sync health route/surface | 20 |
| Error volume | PMS errors route/surface | 15 |
| Mapping completeness | PMS mappings route/surface | 15 |
| Reconciliation state | PMS reconciliation route/surface | 10 |
| Supported vendor maturity | Open Dental vs other vendors | 10 |
| Data quality score | `pms_data_quality_scores` | 10 |

## Score Interpretation

| Score | Meaning |
| ---: | --- |
| 85-100 | Production-ready |
| 70-84 | Pilot-ready |
| 50-69 | Ready with remediation |
| 0-49 | Not ready |

## First Customer PMS Score

62.

Reason: operational surfaces and Open Dental path exist, but live vendor proof is absent and non-Open Dental adapters are not production-certified.

