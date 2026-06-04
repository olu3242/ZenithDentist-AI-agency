# Patient Commerce Certification

Implemented:

- Communication Template OS in `lib/templates/*`
- Stripe gateway wrappers in `lib/payments/*`
- Treatment Acceptance OS in `lib/treatment-acceptance.ts`
- Financing Referral Engine in `lib/financing-referrals.ts`
- Commerce migration `20260621000000_operational_proving_ground_patient_commerce.sql`

Workflow:

Patient -> Treatment -> Payment -> Revenue Attribution -> Executive Reporting

Status: PARTIAL until Stripe, treatment, financing, and attribution records are populated in staging.
