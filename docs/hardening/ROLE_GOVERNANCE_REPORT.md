# Role Governance Report

**Sprint:** Enterprise Tenant
**Score:** 88 / 100 — GO

---

## Summary

A six-tier role hierarchy governs all access decisions on the platform. Numeric role weights enable simple ordinal comparisons for permission gates, and the TenantGuardContext ensures role information is sourced from the verified membership record rather than client-supplied claims.

---

## Role Hierarchy

| Role | Weight | Scope |
|---|---|---|
| super_admin | 100 | Internal Zenith platform operations |
| platform_admin | 90 | Cross-organization platform management |
| organization_owner | 80 | Full control within one organization |
| practice_manager | 60 | Operational management within one organization |
| staff | 40 | Day-to-day task execution |
| read_only | 20 | View-only access |

---

## roleAtLeast() Enforcement

roleAtLeast(requiredRole) compares the numeric weight of the user's current role against the required role weight. A user with practice_manager (60) passes roleAtLeast("practice_manager") and roleAtLeast("staff") but fails roleAtLeast("organization_owner").

This pattern eliminates string comparison errors and makes role gate logic readable and auditable.

---

## TenantGuardContext

Every authenticated request carries a TenantGuardContext that includes:

- userId — from the verified session
- organizationId — from the organization_members record
- organizationSlug — for URL routing
- membershipRole — the user's role in the current organization

membershipRole is always sourced from the database, not from the JWT or session cookie, preventing role escalation via token manipulation.

---

## Platform Admin Routes

Routes requiring cross-organization access are gated with roleAtLeast("platform_admin"). These routes do not apply the tenantQuery() organization filter, allowing aggregated platform-wide queries.

---

## Findings

- Numeric weight system handles edge cases cleanly — no ambiguity between adjacent roles
- super_admin role is reserved for internal use and cannot be assigned via the provisioning API
- All role checks are performed server-side before any data access

---

## Recommendations

- Add role change events to the audit timeline for SOC 2 compliance
- Consider time-limited role elevation (break-glass) for platform_admin access to sensitive operations
