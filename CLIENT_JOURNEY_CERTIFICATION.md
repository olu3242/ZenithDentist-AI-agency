# Client Journey Certification

## Decision

Ready with remediation.

## Certification Basis

The repo contains implemented pathways for lead capture, ROI assessment, access lockdown, implementation projects, go-live checks, operating playbooks, revenue attribution, customer success review, and commercial controls.

Evidence:

- `components/public/roi-funnel-form.tsx`: interactive ROI assessment form.
- `app/actions.ts`: funnel submission and ROI persistence path.
- `lib/client-implementation-os.ts`: implementation blueprints, checklist templates, go-live gates, operating playbooks.
- `lib/access-control.ts`: client access and subscription gate enforcement.
- `docs/COMMERCIAL_AUTOMATION_AUDIT.md`: manual commercial and Stripe readiness caveats.

## Stage Certification

| Stage | Status | Evidence |
| --- | --- | --- |
| Lead | Certified | Public funnel and lead capture code exists |
| Discovery Call | Partially certified | Discovery fields exist; call workflow is manual |
| ROI Assessment | Certified with modeled data caveat | ROI form and calculation path exists |
| Audit Delivery | Partially certified | Audit route exists; follow-up can be manual |
| Proposal | Partially certified | Offer builder exists; contract automation absent |
| Contract | Partially certified | Contract gate exists; e-signature absent |
| Implementation | Certified | Project, tasks, onboarding, playbooks generated |
| Integration Setup | Partially certified | Open Dental path exists; other PMS vendors not production-certified |
| Training | Certified | Role training templates and assignments exist |
| Go Live | Certified with blockers | Go-live checklist exists and enforces gates |
| Optimization | Certified | 30/60/90 day playbooks exist |
| Renewal | Partially certified | Renewal playbook exists; automation incomplete |
| Expansion | Partially certified | Expansion playbook and quote schema exist |

## Readiness Scores

| Area | Score | Evidence Boundary |
| --- | ---: | --- |
| Client Activation Readiness | 78 | Access gates, implementation templates, and onboarding exist; manual commercial steps remain |
| Implementation Readiness | 84 | Implementation OS and go-live gates are strong |
| PMS Readiness | 62 | Open Dental is best covered; Dentrix/Eaglesoft/Denticon remain limited |
| ROI Certification | 76 | ROI formulas and attribution exist; live customer proof is absent |
| Client Success | 82 | Health, reviews, renewal, expansion playbooks exist |
| Executive Reporting | 80 | Portal, Mission Control, and executive scorecards exist |
| Commercial Readiness | 70 | Stripe webhook exists; live credential test and customer portal remain gaps |

## Final Decision

Ready with remediation.

Reason: operational system coverage is real, but first-customer certification cannot be marked fully ready without live PMS credential testing, live Stripe webhook testing, explicit manual-gate runbook ownership, and first customer data proof.

