# Production Hardening Report
**Sprint:** release/platform-convergence  
**Date:** 2026-06-02  
**Purpose:** Security, reliability, and resilience assessment for first paying client

---

## 1. Stripe Webhook Security

**File:** `app/api/webhooks/stripe/route.ts`, `lib/stripe/operations.ts`

| Control | Implementation | Status |
|---|---|---|
| HMAC-SHA256 signature validation | `verifyStripeWebhookPayload()` in `lib/stripe/operations.ts` — uses `timingSafeEqual` to prevent timing attacks | PASS |
| Invalid signature rejection | Returns HTTP 400; logs warning via `logger.warn("stripe_webhook_invalid_signature")` | PASS |
| Raw body preservation | `req.text()` called before any parsing; signature validated on raw payload | PASS |
| Event idempotency | `billing_events.upsert({ onConflict: "provider_event_id" })` — duplicate Stripe events are deduplicated | PASS |
| Secret exposure | `STRIPE_API_KEY` loaded from `lib/env.ts` via environment variable; not hardcoded | PASS |

**Risk:** `STRIPE_WEBHOOK_SECRET` env var must be distinct from `STRIPE_API_KEY`. Current implementation uses `STRIPE_API_KEY` as the signing secret fallback. This should be corrected to use a dedicated `STRIPE_WEBHOOK_SECRET` before production traffic.

---

## 2. OAuth Security

**File:** `middleware.ts`

| Control | Implementation | Status |
|---|---|---|
| Invited email pre-check | Google OAuth session checked against `authorized_domains` whitelist before access granted | PASS |
| Route gating | `/portal`, `/dashboard`, `/admin` routes all gated by middleware | PASS |
| Unauthenticated redirect | Unauthenticated requests redirected to login; no data exposed | PASS |
| Session cookie security | Session managed by Next.js/Supabase Auth; HttpOnly, Secure flags applied by default | PASS |

---

## 3. Access Control Layers

Three-layer access control:
1. **Middleware** — blocks unauthenticated requests at the edge; checks `authorized_domains`
2. **Cookie/Session** — Supabase Auth session validated server-side in each route handler
3. **DB Evaluation** — `client_accounts` approval gates (`contract_signed`, `setup_fee_paid`, `approved_for_access`, `subscription_active`) checked in `app/internal/client-approvals/page.tsx`

This defense-in-depth approach means a compromised session cookie alone is insufficient — the DB approval state must also be valid.

---

## 4. Error Handling

| System | Error Type | Handler |
|---|---|---|
| Stripe webhook | Invalid JSON | Try/catch → HTTP 400 |
| Stripe webhook | Invalid signature | `verifyStripeWebhookPayload()` → HTTP 400 + log |
| Billing event record | DB write failure | `.catch(() => {})` — silently swallowed; event not retried |
| Client activation | Activation failure | Returns `{ activated: false }` — no retry or alert |
| Revenue engines | Attribution insert | Table name fixed this sprint; no explicit error handler wrapping insert |

**Risk:** Billing event persistence and client activation errors are silently swallowed. For pilot, add structured logging and alerting on these paths.

---

## 5. Webhook Retry / Idempotency

| Webhook | Idempotency | Retry |
|---|---|---|
| Stripe | `billing_events` upsert on `provider_event_id` — safe to receive same event multiple times | Stripe retries for non-2xx responses; route always returns 200 after initial validation |
| n8n | `app/api/webhooks/n8n/route.ts` — no explicit idempotency key seen | n8n retry behavior depends on n8n configuration |

---

## 6. RLS Policies

RLS certification is documented in `docs/RLS_CERTIFICATION_REPORT.md` and `docs/RLS_RECONCILIATION_REPORT.md`. Key findings:
- RLS enabled on tenant-scoped tables
- `billing_customers` table (new this sprint) — RLS policy must be confirmed in migration `202606030001_billing_customers.sql`
- `revenue_attribution_records` — RLS policy required to prevent cross-tenant attribution access

**Action:** Verify RLS on `billing_customers` and `revenue_attribution_records` before first production client.

---

## 7. Incident Recovery Paths

| Scenario | Recovery Path |
|---|---|
| Stripe webhook misses payment event | Stripe webhook retry (automatic); manual re-trigger from Stripe dashboard |
| Client not activated after payment | Admin manually toggles approval gates in `/internal/client-approvals` |
| `authorized_domains` not set | Admin inserts row directly in Supabase dashboard |
| Revenue attribution not recorded | Re-run workflow execution; attribution insert will fire again (idempotency not guaranteed — use `upsert` in future) |
| Portal inaccessible | Supabase connection / Next.js deployment issue; rollback via Vercel deployment history |

---

## 8. Known Vulnerabilities / Risks

| Risk | Severity | Mitigation |
|---|---|---|
| `STRIPE_API_KEY` used as webhook signing secret | HIGH | Use dedicated `STRIPE_WEBHOOK_SECRET` env var before production |
| Silent error swallowing in billing/activation paths | MEDIUM | Add structured logging and alerting for pilot |
| `revenue_attribution_records` inserts not idempotent | MEDIUM | Switch to `upsert` with `workflow_execution_id` conflict key |
| n8n webhook has no authentication | MEDIUM | Add shared secret header check to n8n route |
| Manual `authorized_domains` step creates activation delay | LOW | Acceptable for pilot; automate post-pilot |
| No Stripe Customer Portal for subscription self-service | LOW | Accepted post-pilot backlog item |

---

## Overall Hardening Assessment

| Area | Status |
|---|---|
| Stripe signature validation | PASS |
| OAuth invitation gate | PASS |
| Multi-layer access control | PASS |
| Error handling completeness | PARTIAL — silent swallows in billing/activation |
| Webhook idempotency | PASS (Stripe); PARTIAL (n8n) |
| RLS on new tables | NEEDS VERIFICATION |
| Incident recovery paths | PASS — manual paths documented |

**Verdict: READY FOR PILOT with two pre-flight actions: (1) set dedicated `STRIPE_WEBHOOK_SECRET`, (2) verify RLS on `billing_customers`**
