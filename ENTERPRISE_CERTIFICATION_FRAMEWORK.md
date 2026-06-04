# Enterprise Certification Framework

Implemented framework:

- Evidence Producer Framework in `lib/evidence/*`
- Enterprise Certification Center at `/internal/certification`
- Nightly-capable certification runner via `runEnterpriseCertification`
- Scheduled-job compatible endpoint: `/api/internal/certification/nightly`
- Certification tables:
  - `enterprise_certification_runs`
  - `enterprise_certification_results`

Subsystem gates:

| Subsystem | Required |
| --- | ---: |
| Evidence Coverage | 95% |
| Revenue Attribution | 90% |
| AI Decision Traceability | 95% |
| Incident Coverage | 95% |
| Recovery Coverage | 95% |
| SLA Coverage | 95% |

Production certification is blocked unless every gate passes.
