# Commercial Lockdown Framework

Status: PARTIALLY CERTIFIED

## Legal Entity

FinClarity Bookkeeping and Services LLC is the legal operating company.

Zenith AI Automation Agency is a product, service line, and trade brand operated by FinClarity Bookkeeping and Services LLC.

Contract language should identify the service provider as:

`FinClarity Bookkeeping and Services LLC, doing business as (DBA) Zenith AI Automation Agency`

Payment recipient:

`FinClarity Bookkeeping and Services LLC`

## Principle

Clients do not pay for software. Clients pay for outcomes.

Every package must have:

- Defined deliverables
- Defined responsibilities
- Defined success criteria
- Defined payment gates
- Defined SLA
- Defined ownership

## Packages

| Package | Setup Fee | Monthly Fee | Payment Gates | SLA |
| --- | ---: | ---: | --- | --- |
| Revenue Recovery System | $2,500 | $1,500 | 50% contract, 50% go-live | Business Hours Support |
| AI Practice Growth System | $5,000 | $3,500 | 40% contract, 40% configuration complete, 20% go-live | Priority Support |
| Managed AI Operations | $10,000+ | $7,500+ | 30% contract, 30% build complete, 20% testing complete, 20% go-live | Dedicated SLA, Incident Management, Recovery Monitoring |

## Payment Lockdown

- No Go-Live = No Final Implementation Payment.
- Any request outside signed scope becomes a Change Request.
- Additional locations, providers, custom integrations, and custom automations generate Expansion Quotes.
- Technical Approval, Operations Approval, Customer Success Approval, and Executive Approval are required before go-live.

## Stripe Structure

Products:

- Revenue Recovery System
- AI Practice Growth System
- Managed AI Operations

Separate Stripe objects:

- Setup Fee
- Monthly Subscription
- Professional Services
- Expansion Work

These must never be combined because each has different delivery, recognition, and dispute logic.

## Client Protection

Final implementation payment is gated by `Go-Live Certified`.

All software, workflows, automation systems, artificial intelligence systems, dashboards, methodologies, playbooks, templates, documentation, reports, training materials, and proprietary operational frameworks remain the exclusive intellectual property of FinClarity Bookkeeping and Services LLC unless otherwise agreed in writing.

Client access to Zenith AI Automation Agency constitutes a limited subscription and service license only. No ownership rights are transferred except as expressly stated in a written agreement.

Offboarding requires:

- 30 Day Notice
- Outstanding Balance Paid
- Export Package Generated
- Offboarding Checklist Complete

## First-Class Objects

- `commercial_packages`
- `commercial_payment_gates`
- `client_commercial_controls`
- `client_payment_milestones`
- `change_requests`
- `expansion_quotes`
- `client_offboarding_checklists`

## Commercial Governance Fields

- Legal Entity: FinClarity Bookkeeping and Services LLC
- Brand: Zenith AI Automation Agency
- Tax Entity: FinClarity Bookkeeping and Services LLC
- Billing Entity: FinClarity Bookkeeping and Services LLC
- Contract Entity: FinClarity Bookkeeping and Services LLC

## Internal Surface

- `/internal/commercial-lockdown`

## Executive Visibility

The Executive Command Center and Agency CRM expose:

- MRR
- ARR
- Collections
- Outstanding invoices
- Expansion revenue
- Implementation revenue
- Renewal revenue
- Churn revenue
- Billable payment gates
- Overdue payment gates

## Questions Answered

- What has been sold?
- What has been delivered?
- What is billable?
- What is overdue?
- What is at risk?
- What renewals are coming?
- What expansions are available?

## Remaining Certification Work

- Create actual Stripe Products/Prices for setup fees, subscriptions, professional services, and expansion work.
- Wire contract close to `client_commercial_controls`.
- Wire go-live certification to final implementation milestone billing.
- Wire Stripe webhooks to milestone paid status and revenue attribution.
- Validate a real pilot contract from sold package to payment gates to go-live billing.
