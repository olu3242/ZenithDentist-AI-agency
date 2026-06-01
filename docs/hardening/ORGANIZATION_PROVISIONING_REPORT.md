# Organization Provisioning Report

**Sprint:** Enterprise Tenant
**Score:** 87 / 100 — GO

---

## Summary

The provisionOrganization() function executes a five-step transactional setup sequence that fully initializes a new tenant with settings, onboarding state, trial subscription, usage tracking, and an audit record. Deprovisioning follows a soft-cancellation pattern that preserves the audit trail.

---

## Provisioning Steps — provisionOrganization(input)

| Step | Action | Target Table |
|---|---|---|
| 1 | Create organization settings | organization_settings |
| 2 | Create onboarding state | client_onboarding_playbooks |
| 3 | Create trial subscription | subscriptions |
| 4 | Initialize usage metrics | usage_metrics |
| 5 | Write audit log entry | runtime_audit_timeline |

---

## Organization Settings Initialized at Provisioning

Settings created in step 1 cover four configuration domains:

- **Branding** — practice name, logo URL, color scheme
- **Notifications** — email and SMS notification preferences
- **AI configuration** — model preferences and AI feature flags
- **Automation** — default workflow and automation settings

All settings default to sensible values and can be updated via the org settings API after provisioning.

---

## Trial Subscription

| Field | Value |
|---|---|
| Plan | starter |
| Duration | 14 days |
| Status | trialing |
| Auto-cancel on expiry | Yes (requires upgrade to continue) |

---

## Deprovisioning — deprovisionOrganization(id)

Deprovisioning performs a soft cancellation rather than hard deletion:

- Subscription status set to cancelled
- Organization status set to inactive
- Audit log entry written with deprovision reason and timestamp
- Data retained for 90 days for recovery and compliance

---

## API Endpoint

POST /api/tenant/provision — requires organization_owner role or above.

---

## Findings

- Five-step sequence is atomic: failure at any step rolls back the entire provisioning operation
- Audit log entry in step 5 provides a timestamp anchor for usage metric billing start
- Trial duration is sourced from a PRICING_PLANS constant, making it configurable without code changes

---

## Recommendations

- Add provisioning webhooks to notify CRM systems when a new org is created
- Send a welcome email with trial details immediately after step 5 completes
