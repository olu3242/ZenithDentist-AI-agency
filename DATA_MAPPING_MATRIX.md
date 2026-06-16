# Data Mapping Matrix

## Purpose

Evidence-based PMS data mapping for first customer activation.

| Domain | Source Evidence | Zenith Target | Status |
| --- | --- | --- | --- |
| Patients | `patients` table, PMS adapter | Patient master record, PMS external ID, recall date | Partial |
| Appointments | `appointments` table, PMS adapter | Appointment time, provider, status | Partial |
| Providers | PMS adapter, provider scoring tables | Provider roster, capacity, performance | Partial |
| Recall | Recall tables and recovery workflows | Recall due date, overdue status, recovery events | Partial |
| Treatment | Treatment acceptance modules | Treatment plan, amount, acceptance state | Partial |
| Claims | Insurance recovery tables | Claim status, aging, denial, underpayment | Partial |
| Payments | Stripe operations, payment links | Payment event, invoice, subscription | Certified with live credential caveat |
| Reviews | Review workflow and portal surfaces | Reviews generated, request outcomes | Partial |
| Referrals | Referral workflow and revenue opportunity | Referral source, conversion | Partial |
| Memberships | Membership engine | Enrollment, renewal count, churn | Partial |

## Certification Boundary

The repo contains schemas, adapters, and operational surfaces. It does not contain a live vendor field mapping export for a real first customer.

