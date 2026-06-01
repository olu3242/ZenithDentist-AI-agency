# Org Switcher Report

**Sprint:** Enterprise Tenant
**Score:** 75 / 100 — PARTIAL

---

## Summary

The foundational infrastructure for multi-organization switching is in place through TenantGuardContext and the tenant resolver layer. The UI component for switching between organizations in the AppShell is pending implementation, which accounts for the partial score.

---

## Current Capabilities

- TenantGuardContext provides organizationId and organizationSlug on every authenticated request
- resolveTenantById(id) resolves a full tenant context given an organization ID
- resolveTenant(slug) resolves a full tenant context given an organization slug
- Both resolver functions validate that the requesting user is a member of the target organization before returning context

---

## Multi-Org User Support

Users who are members of multiple organizations can switch context by navigating to a different organization slug. The resolver layer handles the context transition, and the TenantGuardContext updates to reflect the new organizationId for subsequent requests.

---

## What Is Working

| Feature | Status |
|---|---|
| Tenant context resolution by ID | Done |
| Tenant context resolution by slug | Done |
| Membership validation on switch | Done |
| API layer org switching | Done |
| AppShell UI switcher dropdown | Pending |
| Recent orgs list | Pending |

---

## Pending Work

The AppShell org switcher dropdown is the primary gap. It should:

- Display the current organization name and logo
- List all organizations the user is a member of
- Highlight the active organization
- Navigate to the target org's slug on selection
- Show a "recent orgs" section for users with large org lists

---

## Findings

- Server-side switching infrastructure is complete and tested
- Score of 75 reflects that the UX layer is missing — users cannot switch orgs via the UI without manually editing the URL
- No data isolation risk from the partial state — org switching is functional, just not discoverable

---

## Recommendations

- Implement the AppShell dropdown in the next sprint to bring this to 90+
- Add a recently-visited orgs list stored in localStorage for fast context switching
- Consider a keyboard shortcut (e.g. Cmd+K org search) for power users managing many practices
