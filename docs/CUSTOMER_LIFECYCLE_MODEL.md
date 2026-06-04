# Customer Lifecycle Model

Date: 2026-06-01

## Lifecycle

Prospect -> Lead -> Audit -> Demo -> Proposal -> Closed Won -> Implementation -> Activation -> Optimization -> Expansion -> Renewal

## Operating Model

Implemented in `lib/commercial-operations.ts` as `buildCustomerLifecycleModel`.

- Prospect through Proposal: owned by Sales and GTM Command Center.
- Closed Won through Activation: owned by Implementation OS.
- Optimization through Renewal: owned by Customer Success OS.

## Stage Gates

Each stage has entry criteria, exit criteria, owner, and primary operating system. No new platform layer was added; this model organizes existing GTM, onboarding, implementation, and customer success capabilities.
