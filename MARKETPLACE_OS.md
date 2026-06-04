# Marketplace OS

## Status

Implemented as reusable extension marketplace foundation.

Primary modules:

- `lib/marketplace-core/*`
- `app/automation-marketplace/*`
- `lib/platform-os/foundation.ts`

## Purpose

Marketplace OS installs, secures, governs, and runs reusable workflow packs and extensions across products.

## Capabilities

- Extension registry
- Install governance
- Config validation
- Sensitive config redaction
- Runtime workflow trigger
- Tenant installation tracking

## Reusability

Marketplace packs should be product-agnostic where possible and product-specific only at the configuration and workflow-template layer.
