# Route Coverage Report
**Branch:** claude/determined-ramanujan-BsncJ  
**Date:** 2026-05-31  
**Scope:** All 37 API routes — guard status, orgId source, auth requirement

---

## Route Coverage Table

| # | Route | Method | Guard | OrgId Source | Auth Required | Status |
|---|-------|--------|-------|-------------|---------------|--------|
| 1 | `/api/alice/alerts` | GET | withTenantGuard | query / x-organization-id header | INTERNAL token (middleware) | PROTECTED |
| 2 | `/api/alice/chat` | POST | withTenantGuard | query / x-organization-id header | INTERNAL token (middleware) | PROTECTED |
| 3 | `/api/alice/forecast` | GET | withTenantGuard | query / x-organization-id header | INTERNAL token (middleware) | PROTECTED |
| 4 | `/api/alice/insights` | GET | withTenantGuard | query / x-organization-id header | INTERNAL token (middleware) | PROTECTED |
| 5 | `/api/alice/orchestration` | POST | withTenantGuard | query / x-organization-id header | INTERNAL token (middleware) | PROTECTED |
| 6 | `/api/alice/recommendations` | GET | NONE | none | None (not on guarded path) | OPEN |
| 7 | `/api/alice/reports` | GET | NONE | none | None (not on guarded path) | OPEN |
| 8 | `/api/analytics/abandoned` | GET | NONE | none | None | OPEN |
| 9 | `/api/analytics/faq` | GET | NONE | none | None | OPEN |
| 10 | `/api/autonomous/approvals` | GET/POST | NONE | none | None | OPEN |
| 11 | `/api/autonomous/simulate` | POST | NONE | none | None | OPEN |
| 12 | `/api/autonomous/state` | GET | NONE | none | None | OPEN |
| 13 | `/api/calendly/events` | POST | NONE (EXEMPT) | none | None | PUBLIC WEBHOOK |
| 14 | `/api/dental/chairs` | GET | NONE | query param `organizationId` | None | PARTIAL |
| 15 | `/api/dental/metrics` | GET | withTenantGuard | query / x-organization-id header | None (not on guarded path) | PARTIAL-GUARDED |
| 16 | `/api/dental/practice` | GET | NONE | query param `organizationId` | None | PARTIAL |
| 17 | `/api/dental/recall` | GET | NONE | query param `organizationId` | None | PARTIAL |
| 18 | `/api/dental/revenue` | GET | NONE | query param `organizationId` | None | PARTIAL |
| 19 | `/api/dental/reviews` | GET | NONE | query param `organizationId` | None | PARTIAL |
| 20 | `/api/enterprise/cloud` | GET | NONE | none | None | OPEN |
| 21 | `/api/enterprise/integrations` | GET | NONE | none | None | OPEN |
| 22 | `/api/enterprise/orchestration` | POST | NONE | none | None | OPEN |
| 23 | `/api/enterprise/simulate` | POST | NONE | none | None | OPEN |
| 24 | `/api/gtm-command-center` | GET/POST | NONE | none | INTERNAL token (middleware) | MIDDLEWARE ONLY |
| 25 | `/api/marketplace/dental` | GET/POST | NONE | query param `organizationId` | None | PARTIAL |
| 26 | `/api/mission-control/automation-audit` | GET | NONE | none | INTERNAL token (middleware) | MIDDLEWARE ONLY |
| 27 | `/api/mission-control/cloud` | GET | NONE | none | INTERNAL token (middleware) | MIDDLEWARE ONLY |
| 28 | `/api/mission-control/evaluate` | POST | NONE | none | INTERNAL token (middleware) | MIDDLEWARE ONLY |
| 29 | `/api/mission-control/executive-report` | GET | NONE | none | INTERNAL token (middleware) | MIDDLEWARE ONLY |
| 30 | `/api/mission-control/governance` | GET | NONE | none | INTERNAL token (middleware) | MIDDLEWARE ONLY |
| 31 | `/api/mission-control/operational-summary` | GET | NONE | query param `organizationId` | INTERNAL token (middleware) | MIDDLEWARE + PARTIAL |
| 32 | `/api/mission-control/platform` | GET | NONE | none | INTERNAL token (middleware) | MIDDLEWARE ONLY |
| 33 | `/api/mission-control/replay` | POST | NONE | none | INTERNAL token (middleware) | MIDDLEWARE ONLY |
| 34 | `/api/mission-control/runtime-health` | GET | NONE | none | INTERNAL token (middleware) | MIDDLEWARE ONLY |
| 35 | `/api/mission-control/state` | GET | NONE | query param `organizationId` | INTERNAL token (middleware) | MIDDLEWARE + PARTIAL |
| 36 | `/api/opendental/sync` | POST | NONE (EXEMPT) | none | None | PUBLIC WEBHOOK |
| 37 | `/api/reports/[id]` | GET | NONE | path param `id` + query `organizationId` | None | PARTIAL |

---

## Coverage Summary

| Status | Count | Percentage | Description |
|--------|-------|-----------|-------------|
| PROTECTED | 5 | 13.5% | withTenantGuard() called; org resolved and validated |
| PARTIAL-GUARDED | 1 | 2.7% | withTenantGuard() present, but not on middleware-protected path |
| MIDDLEWARE ONLY | 9 | 24.3% | Static token check at middleware; no tenant scoping in route |
| MIDDLEWARE + PARTIAL | 2 | 5.4% | Static token + orgId param accepted without guard |
| PARTIAL | 6 | 16.2% | orgId accepted from caller without validation; no middleware protection |
| OPEN | 12 | 32.4% | No token required; no orgId scoping |
| PUBLIC WEBHOOK | 2 | 5.4% | Intentionally public; inbound webhooks |

---

## Routes by Protection Category

### Fully Protected (withTenantGuard wired)
- `/api/alice/alerts` — guard at `alice/alerts/route.ts:6`
- `/api/alice/chat` — guard at `alice/chat/route.ts:12`
- `/api/alice/forecast` — guard at `alice/forecast/route.ts:8`
- `/api/alice/insights` — guard at `alice/insights/route.ts:7`
- `/api/alice/orchestration` — guard present

### Public Webhook Exemptions (intentional — no guard needed)
- `/api/opendental/sync` — receives inbound OpenDental pilot sync; no orgId context in payload
- `/api/calendly/events` — receives Calendly webhook events; no signed verification present

### Routes Needing withTenantGuard (prioritized)

**Highest priority (contain sensitive dental/PHI-adjacent data):**
1. `/api/dental/chairs`
2. `/api/dental/practice`
3. `/api/dental/recall`
4. `/api/dental/revenue`
5. `/api/dental/reviews`
6. `/api/mission-control/state`
7. `/api/mission-control/operational-summary`
8. `/api/alice/recommendations`
9. `/api/alice/reports`
10. `/api/marketplace/dental`

**Second priority (operational/admin data):**
11. `/api/mission-control/automation-audit`
12. `/api/mission-control/evaluate`
13. `/api/mission-control/executive-report`
14. `/api/mission-control/governance`
15. `/api/mission-control/replay`
16. `/api/mission-control/runtime-health`
17. `/api/mission-control/cloud`
18. `/api/mission-control/platform`
19. `/api/gtm-command-center`
20. `/api/reports/[id]`

**Third priority (simulation/analytics — lower immediate PHI risk):**
21. `/api/autonomous/approvals`
22. `/api/autonomous/simulate`
23. `/api/autonomous/state`
24. `/api/enterprise/cloud`
25. `/api/enterprise/integrations`
26. `/api/enterprise/orchestration`
27. `/api/enterprise/simulate`
28. `/api/analytics/abandoned`
29. `/api/analytics/faq`

---

## Middleware Path Coverage

The following path prefixes are checked in `middleware.ts` matcher config:

```
/admin/:path*
/portal/:path*
/internal/:path*
/dashboard/:path*
/mission-control/:path*
/api/mission-control/:path*
/api/gtm-command-center/:path*
/lead-operations/:path*
/client-operations/:path*
/gtm-command-center/:path*
```

**NOT in middleware matcher:**
- `/api/alice/*`
- `/api/dental/*`
- `/api/analytics/*`
- `/api/autonomous/*`
- `/api/enterprise/*`
- `/api/marketplace/*`
- `/api/reports/*`
- `/api/calendly/*`
- `/api/opendental/*`

All routes under these prefixes are accessible without any token if an attacker has the URL. Route-level `withTenantGuard()` is the only protection for these routes, and most are unguarded.
