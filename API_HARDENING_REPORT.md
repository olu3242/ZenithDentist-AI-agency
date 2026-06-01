# API Hardening Report

## Current Protections

- Middleware protects mission-control and GTM command APIs.
- Security headers are applied from middleware.
- Rate limiting is applied by pathname and IP.
- Lead and onboarding server actions validate and report failures.

## Remaining Gaps

- Several `app/api/**` routes should receive per-route schema validation and role-specific authorization checks.
- Rate limiting is in-memory and should move to durable infrastructure for multi-instance production.
